package engine

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type Config struct {
	WorkspaceRoot string
	SessionDir    string
	Model         Model
	Now           func() time.Time
}

type Engine struct {
	cfg Config

	mu       sync.RWMutex
	sessions map[string]*session
}

type session struct {
	ID          string
	PromptPath  string // relative to workspace root
	ContextPath string // optional

	Baseline string
	Working  string

	CreatedAt time.Time
}

type CreateSessionParams struct {
	PromptPath  string
	ContextPath string
}

type RunParams struct {
	Input string
	Vars  map[string]any
}

func New(cfg Config) *Engine {
	return &Engine{
		cfg:      cfg,
		sessions: make(map[string]*session),
	}
}

func (e *Engine) CreateSession(ctx context.Context, p CreateSessionParams) (string, error) {
	_ = ctx
	promptPath := strings.TrimSpace(p.PromptPath)
	if promptPath == "" {
		return "", errors.New("prompt_path required")
	}

	abs := filepath.Clean(filepath.Join(e.cfg.WorkspaceRoot, promptPath))
	if !strings.HasPrefix(abs, filepath.Clean(e.cfg.WorkspaceRoot)+string(os.PathSeparator)) &&
		abs != filepath.Clean(e.cfg.WorkspaceRoot) {
		return "", errors.New("invalid prompt_path (path traversal)")
	}

	b, err := os.ReadFile(abs)
	if err != nil {
		return "", errors.New("failed to read baseline prompt: " + err.Error())
	}
	baseline := string(b)

	id, err := newID()
	if err != nil {
		return "", err
	}

	// If overlay exists (resume), load it; otherwise working = baseline.
	working, ok, err := e.loadOverlay(id) // normally false; but keeps API consistent
	if err != nil {
		return "", err
	}
	if !ok {
		working = baseline
	}

	s := &session{
		ID:          id,
		PromptPath:  promptPath,
		ContextPath: strings.TrimSpace(p.ContextPath),
		Baseline:    baseline,
		Working:     working,
		CreatedAt:   e.cfg.Now(),
	}

	e.mu.Lock()
	e.sessions[id] = s
	e.mu.Unlock()

	// Persist initial overlay so refresh doesn't lose state
	if err := e.persistOverlay(id, s.Working); err != nil {
		return "", err
	}

	return id, nil
}

func (e *Engine) GetPrompt(ctx context.Context, sessionID string) (baseline string, working string, err error) {
	_ = ctx
	s, err := e.getSession(sessionID)
	if err != nil {
		return "", "", err
	}
	return s.Baseline, s.Working, nil
}

func (e *Engine) UpdatePrompt(ctx context.Context, sessionID string, text string) error {
	_ = ctx
	if strings.TrimSpace(text) == "" {
		// You can allow empty if you want; usually better to allow and let verify fail.
	}
	e.mu.Lock()
	s, ok := e.sessions[sessionID]
	if !ok {
		e.mu.Unlock()
		return errors.New("session not found")
	}
	s.Working = text
	e.mu.Unlock()

	return e.persistOverlay(sessionID, text)
}

func (e *Engine) Run(ctx context.Context, sessionID string, p RunParams) (runID string, output string, err error) {
	s, err := e.getSession(sessionID)
	if err != nil {
		return "", "", err
	}

	runID, err = newID()
	if err != nil {
		return "", "", err
	}

	out, err := e.cfg.Model.Run(ctx, s.Working, p.Input, p.Vars)
	if err != nil {
		return "", "", err
	}
	return runID, out, nil
}

func (e *Engine) Save(ctx context.Context, sessionID string) (string, error) {
	_ = ctx
	s, err := e.getSession(sessionID)
	if err != nil {
		return "", err
	}

	abs := filepath.Clean(filepath.Join(e.cfg.WorkspaceRoot, s.PromptPath))
	if err := os.WriteFile(abs, []byte(s.Working), 0o644); err != nil {
		return "", err
	}
	return abs, nil
}

func (e *Engine) getSession(sessionID string) (*session, error) {
	e.mu.RLock()
	s, ok := e.sessions[sessionID]
	e.mu.RUnlock()
	if !ok {
		return nil, errors.New("session not found")
	}
	return s, nil
}

func newID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}
