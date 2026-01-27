package engine

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type overlayFile struct {
	SessionID string `json:"session_id"`
	Working   string `json:"working"`
}

func (e *Engine) overlayPath(sessionID string) string {
	return filepath.Join(e.cfg.SessionDir, sessionID+".json")
}

func (e *Engine) persistOverlay(sessionID string, working string) error {
	tmp := overlayFile{SessionID: sessionID, Working: working}
	b, err := json.MarshalIndent(tmp, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(e.overlayPath(sessionID), b, 0o600)
}

func (e *Engine) loadOverlay(sessionID string) (string, bool, error) {
	p := e.overlayPath(sessionID)
	b, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return "", false, nil
		}
		return "", false, err
	}
	var of overlayFile
	if err := json.Unmarshal(b, &of); err != nil {
		return "", false, err
	}
	return of.Working, true, nil
}
