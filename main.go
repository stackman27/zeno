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
	has := func(path string) bool {
		_, err := os.Stat(filepath.Join(repoDir, path))
		return err == nil
	}

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
	fmt.Println("  myrunner run --repo <url> [--ref main] --workflow <run|test|lint|build> --entry <file> [--publish 0] [--timeout 10m]")
}

func runCmd(args []string) {
	fs := flag.NewFlagSet("run", flag.ExitOnError)
	repo := fs.String("repo", "", "Git repo URL (https://...)")
	ref := fs.String("ref", "main", "Git ref (branch/tag). For SHA support add a checkout step.")
	workflow := fs.String("workflow", "test", "Workflow: test|lint|build")
	publish := fs.Int("publish", 0, "Host port to publish (0 = pick a free port)")

	entry := fs.String("entry", "", "Entry file to run (required for --workflow run), e.g. server.py")
	timeout := fs.Duration("timeout", 10*time.Minute, "Timeout (e.g. 10m, 1h)")
	fs.Parse(args)

	if *repo == "" {
		fmt.Println("error: --repo is required")
		os.Exit(2)
	}

	if *entry == "" {
		fmt.Println("error: --entry is required (e.g. --entry server.py)")
		os.Exit(2)
	}

	hostPort := *publish
	if hostPort == 0 {
		p, err := pickFreePort()
		if err != nil {
			fmt.Println("error: failed to pick a free port:", err)
			os.Exit(2)
		}
		hostPort = p
	}
	fmt.Printf("[info] will publish on http://localhost:%d\n", hostPort)

	wf := AllowedCommand(*workflow)
	if !wf.Valid() {
		fmt.Println("error: --workflow must be one of run|test|lint|build")
		os.Exit(2)
	}

	ctx := context.Background()
	res, err := RunRepo(ctx, *repo, *ref, wf, *entry, hostPort, *timeout, func(line string) {
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
	entry string,
	hostPort int,
	timeout time.Duration,
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

	repoDir, err := os.MkdirTemp(".", "myrunner-repo-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(repoDir)

	// Clone
	cloneArgs := []string{"clone", "--depth", "1", "--branch", ref, repoURL, repoDir}
	if _, err := runProcessCapture(ctx, "git", cloneArgs, "", onLog, io.Discard, io.Discard); err != nil {
		return nil, fmt.Errorf("git clone failed: %w", err)
	}

	// Detect
	pt, err := DetectProjectType(repoDir)
	if err != nil {
		return nil, err
	}
	if onLog != nil {
		onLog(fmt.Sprintf("[info] detected project type: %s\n", pt))
	}

	// Ensure image exists (build if missing)
	image, err := EnsureRunnerImage(ctx, pt, onLog)
	if err != nil {
		return nil, err
	}

	// Run in Docker
	var stdoutBuf, stderrBuf bytes.Buffer
	extraEnv := map[string]string{}
	if v := os.Getenv("TEST_OPENAI_API_KEY"); v != "" {
		extraEnv["TEST_OPENAI_API_KEY"] = v
	}

	exitCode, runErr := RunDockerWorkflow(
		ctx,
		image,
		repoDir,
		onLog,
		&stdoutBuf,
		&stderrBuf,
		cmd,
		entry, // or from a --entry flag
		"",    // or from a --env-file flag
		extraEnv,
		hostPort,
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
	workflow AllowedCommand,
	entry string, // NEW: python entrypoint like server.py
	envFile string, // NEW: path to .env file (optional)
	extraEnv map[string]string, // NEW: extra env vars (optional)
	hostPort int,
) (int, error) {
	workDir, err := os.MkdirTemp("", "myrunner-work-*")
	if err != nil {
		return -1, err
	}
	defer os.RemoveAll(workDir)

	containerPort := 5001 // keep fixed for now

	args := []string{
		"run", "--rm",
		"--cpus=2",
		"--memory=4g",
		"--pids-limit=256",
		"--security-opt=no-new-privileges:true",
		"--cap-drop=ALL",
		"-e", "WORKFLOW=" + string(workflow),
		"-e", "TARGET_PORT=5000",
	}

	args = append(args, "-p", fmt.Sprintf("%d:%d", hostPort, containerPort))
	args = append(args,
		"-e", "EXPOSE_PORT=5001",
		"-e", "TARGET_PORT=5000",
	)

	// Pass entrypoint to container (runner.sh can default if empty)
	if entry != "" {
		args = append(args, "-e", "ENTRY="+entry)
	}

	// Optional: env-file support (e.g. .env containing OPENAI_API_KEY=...)
	if envFile != "" {
		args = append(args, "--env-file", envFile)
	}

	// Optional: pass through a couple env vars explicitly
	for k, v := range extraEnv {
		args = append(args, "-e", k+"="+v)
	}

	// Mounts + image
	args = append(args,
		"-v", repoDir+":/input:ro",
		"-v", workDir+":/work:rw",
		image,
	)

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
