package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/stackman27/zeno/internal/api"
	"github.com/stackman27/zeno/internal/engine"
)

func main() {
	addr := env("SANDBOX_ADDR", ":4173")
	sessionDir := env("SANDBOX_SESSION_DIR", "/tmp/prompt-sandbox-sessions")
	cwd, _ := os.Getwd()
	workspaceRoot := env("SANDBOX_WORKSPACE_ROOT", cwd)

	if err := os.MkdirAll(sessionDir, 0o755); err != nil {
		log.Fatalf("mkdir session dir: %v", err)
	}

	eng := engine.New(engine.Config{
		WorkspaceRoot: workspaceRoot,
		SessionDir:    sessionDir,
		Model:         engine.NewEchoModel(), // Replace with real model adapter later
		Now:           time.Now,
	})

	srv := api.NewServer(eng)

	log.Printf("prompt sandbox listening on %s", addr)
	log.Printf("workspace root: %s", workspaceRoot)
	log.Printf("session dir: %s", sessionDir)

	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		log.Fatalf("listen: %v", err)
	}
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
