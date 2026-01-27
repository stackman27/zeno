package engine

import (
	"context"
	"strings"
)

type CheckResult struct {
	Name   string
	Pass   bool
	Detail string
}

type VerifyResult struct {
	Pass   bool
	Checks []CheckResult
	Notes  []string
}

func (e *Engine) Verify(ctx context.Context, sessionID string) (VerifyResult, error) {
	_ = ctx
	s, err := e.getSession(sessionID)
	if err != nil {
		return VerifyResult{}, err
	}

	var checks []CheckResult

	// Example checks (replace with lint + eval suite):
	checks = append(checks, CheckResult{
		Name:   "prompt_non_empty",
		Pass:   strings.TrimSpace(s.Working) != "",
		Detail: "working prompt must not be empty",
	})
	checks = append(checks, CheckResult{
		Name:   "no_todo_markers",
		Pass:   !strings.Contains(strings.ToLower(s.Working), "todo"),
		Detail: "working prompt should not contain TODO",
	})

	pass := true
	for _, c := range checks {
		if !c.Pass {
			pass = false
			break
		}
	}

	return VerifyResult{
		Pass:   pass,
		Checks: checks,
	}, nil
}
