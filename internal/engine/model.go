package engine

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
)

type Model interface {
	Run(ctx context.Context, prompt string, input string, vars map[string]any) (string, error)
}

type EchoModel struct{}

func NewEchoModel() *EchoModel { return &EchoModel{} }

func (m *EchoModel) Run(ctx context.Context, prompt string, input string, vars map[string]any) (string, error) {
	// Replace with:
	// - local LLM
	// - customer-hosted endpoint (allowlisted)
	// - record/replay adapter
	_ = ctx
	h := sha256.Sum256([]byte(prompt + "\n" + input))
	return "ECHO_MODEL_OUTPUT\n\n" +
		"prompt_hash=" + hex.EncodeToString(h[:8]) + "\n" +
		"input=" + input + "\n", nil
}
