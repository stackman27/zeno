package main

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type AllowedCommand string

const (
	CmdRun   AllowedCommand = "run"
	CmdTest  AllowedCommand = "test"
	CmdBuild AllowedCommand = "build"
	CmdLint  AllowedCommand = "lint"
)

func (c AllowedCommand) Valid() bool {
	return c == CmdRun || c == CmdTest || c == CmdBuild || c == CmdLint
}

type ProjectType string

const (
	ProjPython   ProjectType = "python"
	ProjNode     ProjectType = "node"
	ProjPolyglot ProjectType = "polyglot"
	ProjUnknown  ProjectType = "unknown"
)

func DetectProjectType(repoDir string) (ProjectType, error) {
	has := func(rel string) bool {
		_, err := os.Stat(filepath.Join(repoDir, rel))
		return err == nil
	}

	// TODO MAKE THIS MORE GENERIC
	// monorepo: python-server + react-frontend
	monoPy := has("python-server/requirements.txt") || has("python-server/pyproject.toml") || has("python-server/Pipfile")
	monoNode := has("react-frontend/package.json")
	if monoPy && monoNode {
		return ProjPolyglot, nil
	}

	// repo-root layout
	py := has("pyproject.toml") || has("requirements.txt") || has("Pipfile")
	node := has("package.json")

	switch {
	case py && node:
		return ProjPolyglot, nil
	case py:
		return ProjPython, nil
	case node:
		return ProjNode, nil
	default:
		return ProjUnknown, nil
	}
}

func RunnerImage(pt ProjectType) string {
	switch pt {
	case ProjPython:
		return "zeno/runner-python:latest"
	case ProjNode:
		return "zeno/runner-node:latest"
	case ProjPolyglot:
		return "zeno/runner-polyglot:latest"
	default:
		// fallback
		return "zeno/runner-polyglot:latest"
	}
}

func DockerfileFor(pt ProjectType) string {
	switch pt {
	case ProjPython:
		return "runner-python.Dockerfile"
	case ProjNode:
		return "runner-node.Dockerfile"
	case ProjPolyglot:
		return "runner-polyglot.Dockerfile"
	default:
		return "runner-polyglot.Dockerfile"
	}
}

type RunResult struct {
	ExitCode int
	Stdout   string
	Stderr   string
}

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "run":
		runCmd(os.Args[2:])
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Println("Usage:")
	fmt.Println("zeno run --repo <url> [--ref main] --workflow <run|test|lint|build> [--service all|ui|api] [--entry <file>] [--publish-ui 0] [--publish-api 0] [--timeout 10m]")
}

func runCmd(args []string) {
	fs := flag.NewFlagSet("run", flag.ExitOnError)
	repo := fs.String("repo", "", "Git repo URL (https://...)")
	ref := fs.String("ref", "main", "Git ref (branch/tag). For SHA support add a checkout step.")
	workflow := fs.String("workflow", "test", "Workflow: run|test|lint|build")
	publishUI := fs.Int("publish-ui", 0, "Host port for UI (0 = pick a free port)")
	publishAPI := fs.Int("publish-api", 0, "Host port for API (0 = pick a free port)")
	service := fs.String("service", "all", "For polyglot run: all|ui|api")
	checkoutDir := fs.String("dir", "", "Checkout directory for the repo (persistent). If empty, defaults to ./repos/<name>")

	entry := fs.String("entry", "", "Entry file to run (required for --workflow=run on non-polyglot repos)")
	timeout := fs.Duration("timeout", 10*time.Minute, "Timeout (e.g. 10m, 1h)")
	fs.Parse(args)

	if *repo == "" {
		fmt.Println("error: --repo is required")
		os.Exit(2)
	}

	if *checkoutDir == "" {
		// derive repo name: chat-buddy from https://github.com/stackman27/chat-buddy
		name := strings.TrimSuffix(filepath.Base(*repo), ".git")
		*checkoutDir = filepath.Join("repos", name)
	}

	needUI := false
	needAPI := false

	wf := AllowedCommand(*workflow)
	if !wf.Valid() {
		fmt.Println("error: --workflow must be one of run|test|lint|build")
		os.Exit(2)
	}

	svc := strings.ToLower(*service)
	if svc != "all" && svc != "ui" && svc != "api" {
		fmt.Println("error: --service must be one of all|ui|api")
		os.Exit(2)
	}

	if wf == CmdRun {
		// For run, service decides which ports we need.
		if svc == "all" {
			needAPI = true
			needUI = true
		} else if svc == "api" {
			needUI = false
			needAPI = true
		} else if svc == "ui" {
			needUI = true
			needAPI = false
		}
	} else {
		// For test/lint/build you don't need any published ports.
		needUI = false
		needAPI = false
	}

	hostPortPublishUI := 0
	hostPortPublishAPI := 0

	if needUI {
		hostPortPublishUI = *publishUI
		if hostPortPublishUI == 0 {
			p, err := pickFreePort()
			if err != nil {
				fmt.Println("error: failed to pick a free port:", err)
				os.Exit(2)
			}
			hostPortPublishUI = p
		}
		fmt.Printf("[info] UI:  http://localhost:%d\n", hostPortPublishUI)
	}

	if needAPI {
		hostPortPublishAPI = *publishAPI
		if hostPortPublishAPI == 0 {
			p, err := pickFreePort()
			if err != nil {
				fmt.Println("error: failed to pick a free port:", err)
				os.Exit(2)
			}
			hostPortPublishAPI = p
		}
		fmt.Printf("[info] API: http://localhost:%d\n", hostPortPublishAPI)
	}

	ctx := context.Background()
	res, err := RunRepo(ctx, *repo, *ref, wf, svc, *entry, hostPortPublishUI, hostPortPublishAPI, *timeout, *checkoutDir, func(line string) {
		fmt.Print(line)
	})
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(2)
	}

	// If command failed, propagate exit code
	if res.ExitCode != 0 {
		os.Exit(res.ExitCode)
	}
}

func RunRepo(
	parent context.Context,
	repoURL string,
	ref string,
	cmd AllowedCommand,
	service string,
	entry string,
	hostPortPublishUI int,
	hostPortPublishAPI int,
	timeout time.Duration,
	checkoutDir string,
	onLog func(line string),
) (*RunResult, error) {
	if ref == "" {
		ref = "main"
	}
	if strings.Contains(repoURL, "file://") || strings.HasPrefix(repoURL, "/") {
		return nil, errors.New("invalid repo url")
	}

	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	repoDir := checkoutDir

	if _, err := os.Stat(repoDir); os.IsNotExist(err) {
		// first time clone
		if err := os.MkdirAll(filepath.Dir(repoDir), 0o755); err != nil {
			return nil, err
		}
		cloneArgs := []string{"clone", "--branch", ref, repoURL, repoDir}
		if _, err := runProcessCapture(ctx, "git", cloneArgs, "", onLog, io.Discard, io.Discard); err != nil {
			return nil, fmt.Errorf("git clone failed: %w", err)
		}
	} else {
		// repo exists: check dirty first
		dirtyArgs := []string{"-C", repoDir, "status", "--porcelain"}
		var out bytes.Buffer
		_, _ = runProcessCapture(ctx, "git", dirtyArgs, "", nil, &out, io.Discard)

		if strings.TrimSpace(out.String()) != "" {
			if onLog != nil {
				onLog("[warn] repo has local changes; skipping fetch/checkout\n")
			}
		} else {
			// safe to update
			fetchArgs := []string{"-C", repoDir, "fetch", "origin", ref, "--depth", "1"}
			_, _ = runProcessCapture(ctx, "git", fetchArgs, "", onLog, io.Discard, io.Discard)

			checkoutArgs := []string{"-C", repoDir, "checkout", ref}
			if _, err := runProcessCapture(ctx, "git", checkoutArgs, "", onLog, io.Discard, io.Discard); err != nil {
				checkoutHead := []string{"-C", repoDir, "checkout", "FETCH_HEAD"}
				if _, err2 := runProcessCapture(ctx, "git", checkoutHead, "", onLog, io.Discard, io.Discard); err2 != nil {
					return nil, fmt.Errorf("git checkout failed: %w", err)
				}
			}
		}
	}

	// Detect
	pt, err := DetectProjectType(repoDir)
	if err != nil {
		return nil, err
	}
	if onLog != nil {
		onLog(fmt.Sprintf("[info] detected project type: %s\n", pt))
	}

	if cmd == CmdRun && pt != ProjPolyglot && service != "ui" && entry == "" {
		return nil, fmt.Errorf("--entry is required for %s repos when --workflow=run", pt)
	}

	// Ensure image exists (build if missing)
	image, err := EnsureRunnerImage(ctx, pt, onLog)
	if err != nil {
		return nil, err
	}

	// Run in Docker
	var stdoutBuf, stderrBuf bytes.Buffer
	extraEnv := map[string]string{}
	if v := os.Getenv("OPENAI_API_KEY"); v != "" {
		extraEnv["OPENAI_API_KEY"] = v
	}

	exitCode, runErr := RunDockerWorkflow(
		ctx, image, repoDir, onLog,
		&stdoutBuf, &stderrBuf,
		pt,
		cmd,
		service, // NEW
		entry,
		"",
		extraEnv,
		hostPortPublishUI,
		hostPortPublishAPI,
	)

	return &RunResult{
		ExitCode: exitCode,
		Stdout:   stdoutBuf.String(),
		Stderr:   stderrBuf.String(),
	}, runErr
}

func EnsureRunnerImage(ctx context.Context, pt ProjectType, onLog func(string)) (string, error) {
	image := RunnerImage(pt)

	// Already available locally?
	if err := exec.CommandContext(ctx, "docker", "image", "inspect", image).Run(); err == nil {
		return image, nil
	}

	dockerfile := DockerfileFor(pt)

	// Sanity check required files exist in CWD
	for _, f := range []string{dockerfile, "runner.sh"} {
		if _, err := os.Stat(f); err != nil {
			return "", fmt.Errorf("missing %s in current directory (run from tool repo root)", f)
		}
	}

	if onLog != nil {
		onLog(fmt.Sprintf("[info] building runner image %s using %s\n", image, dockerfile))
	}

	args := []string{"build", "-t", image, "-f", dockerfile, "."}
	_, err := runProcessCapture(ctx, "docker", args, "", onLog, io.Discard, io.Discard)
	if err != nil {
		return "", fmt.Errorf("failed to build image %s: %w", image, err)
	}
	return image, nil
}

func RunDockerWorkflow(
	ctx context.Context,
	image string,
	repoDir string,
	onLog func(string),
	stdoutBuf, stderrBuf io.Writer,
	pt ProjectType,
	workflow AllowedCommand,
	service string, // NEW
	entry string,
	envFile string,
	extraEnv map[string]string,
	uiHostPort int,
	apiHostPort int,
) (int, error) {
	workDir, err := os.MkdirTemp("", "zeno-work-*")
	if err != nil {
		return -1, err
	}
	defer os.RemoveAll(workDir)

	args := []string{
		"run", "--rm",
		"--cpus=2",
		"--memory=4g",
		"--pids-limit=256",
		"--security-opt=no-new-privileges:true",
		"--cap-drop=ALL",
		"-e", "WORKFLOW=" + string(workflow),
	}

	// ---- polyglot monorepo RUN: publish UI + API ----
	if pt == ProjPolyglot && workflow == CmdRun {
		frontExpose := 3001
		backExpose := 5001

		if (service == "all" || service == "ui") && uiHostPort != 0 {
			args = append(args, "-p", fmt.Sprintf("%d:%d", uiHostPort, frontExpose))
			args = append(args, "-e", "FRONT_PORT=3001") // new: single source of truth
		}
		if (service == "all" || service == "api") && apiHostPort != 0 {
			args = append(args, "-p", fmt.Sprintf("%d:%d", apiHostPort, backExpose))
			args = append(args, "-e", "BACK_EXPOSE_PORT=5001", "-e", "BACK_TARGET_PORT=5000")
		}

	} else {

		// ---- single-port mode (python-only or node-only) ----
		exposePort := 5001
		targetPort := 5000

		if uiHostPort != 0 {
			args = append(args, "-p", fmt.Sprintf("%d:%d", uiHostPort, exposePort))
		}
		args = append(args,
			"-e", fmt.Sprintf("EXPOSE_PORT=%d", exposePort),
			"-e", fmt.Sprintf("TARGET_PORT=%d", targetPort),
		)

	}

	args = append(args, "-e", "SERVICE="+service)
	args = append(args, "--user", fmt.Sprintf("%d:%d", os.Getuid(), os.Getgid()))
	// ENTRY (only matters for non-monorepo python/node right now)
	if entry != "" {
		args = append(args, "-e", "ENTRY="+entry)
	}

	if envFile != "" {
		args = append(args, "--env-file", envFile)
	}

	for k, v := range extraEnv {
		args = append(args, "-e", k+"="+v)
	}

	args = append(args,
		"-v", repoDir+":/repo:rw",
		"-v", workDir+":/work:rw",
	)

	// if pt == ProjPolyglot {
	// 	args = append(args, "-v", "zeno_node_modules:/work/react-node_modules")
	// }

	args = append(args, image)

	return runProcessCapture(ctx, "docker", args, "", onLog, stdoutBuf, stderrBuf)
}

func pickFreePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func runProcessCapture(
	ctx context.Context,
	name string,
	args []string,
	dir string,
	onLog func(string),
	stdoutBuf, stderrBuf io.Writer,
) (int, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Dir = dir

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return -1, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return -1, err
	}

	if err := cmd.Start(); err != nil {
		return -1, err
	}

	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()

	go teeScan(stdout, "[stdout] ", stdoutBuf, onLog)
	go teeScan(stderr, "[stderr] ", stderrBuf, onLog)

	select {
	case err := <-done:
		return exitCodeFromErr(err), err
	case <-ctx.Done():
		_ = cmd.Process.Kill()
		<-done
		return -1, ctx.Err()
	}
}

func exitCodeFromErr(err error) int {
	if err == nil {
		return 0
	}
	var ee *exec.ExitError
	if errors.As(err, &ee) {
		return ee.ExitCode()
	}
	return -1
}

func teeScan(r io.Reader, prefix string, capture io.Writer, onLog func(string)) {
	s := bufio.NewScanner(r)
	// Increase buffer for long log lines
	buf := make([]byte, 0, 1024*1024)
	s.Buffer(buf, 10*1024*1024)

	for s.Scan() {
		line := prefix + s.Text() + "\n"
		if capture != nil {
			_, _ = capture.Write([]byte(line))
		}
		if onLog != nil {
			onLog(line)
		}
	}
}
