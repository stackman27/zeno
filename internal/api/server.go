package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/stackman27/zeno/internal/engine"
)

type Server struct {
	eng *engine.Engine
	mux *http.ServeMux
}

func NewServer(eng *engine.Engine) *Server {
	s := &Server{eng: eng, mux: http.NewServeMux()}

	// Health
	s.mux.HandleFunc("/healthz", s.handleHealth)

	// Sessions
	s.mux.HandleFunc("/sessions", s.handleSessions)             // POST
	s.mux.HandleFunc("/sessions/", s.handleSessionSubresources) // GET/PUT/POST

	return s
}

func (s *Server) Handler() http.Handler {
	// Simple CORS for localhost UI / clients
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:4173")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		s.mux.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleSessions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid json")
		return
	}
	if strings.TrimSpace(req.PromptPath) == "" {
		writeErr(w, http.StatusBadRequest, "prompt_path is required")
		return
	}

	id, err := s.eng.CreateSession(r.Context(), engine.CreateSessionParams{
		PromptPath:  req.PromptPath,
		ContextPath: req.ContextPath,
	})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, CreateSessionResponse{SessionID: id})
}

func (s *Server) handleSessionSubresources(w http.ResponseWriter, r *http.Request) {
	// /sessions/{id}/...
	path := strings.TrimPrefix(r.URL.Path, "/sessions/")
	parts := strings.Split(path, "/")
	if len(parts) < 1 || parts[0] == "" {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
	sid := parts[0]

	// /sessions/{id}
	if len(parts) == 1 {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}

	switch parts[1] {
	case "prompt":
		s.handlePrompt(w, r, sid)
		return
	case "run":
		s.handleRun(w, r, sid)
		return
	case "verify":
		s.handleVerify(w, r, sid)
		return
	case "save":
		s.handleSave(w, r, sid)
		return
	default:
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
}

func (s *Server) handlePrompt(w http.ResponseWriter, r *http.Request, sid string) {
	switch r.Method {
	case http.MethodGet:
		baseline, working, err := s.eng.GetPrompt(r.Context(), sid)
		if err != nil {
			writeErr(w, http.StatusNotFound, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, GetPromptResponse{Baseline: baseline, Working: working})
	case http.MethodPut:
		var req UpdatePromptRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErr(w, http.StatusBadRequest, "invalid json")
			return
		}
		if err := s.eng.UpdatePrompt(r.Context(), sid, req.Text); err != nil {
			writeErr(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	default:
		writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleRun(w http.ResponseWriter, r *http.Request, sid string) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid json")
		return
	}
	runID, output, err := s.eng.Run(r.Context(), sid, engine.RunParams{
		Input: req.Input,
		Vars:  req.Vars,
	})
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, RunResponse{RunID: runID, Output: output})
}

func (s *Server) handleVerify(w http.ResponseWriter, r *http.Request, sid string) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	res, err := s.eng.Verify(r.Context(), sid)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, VerifyResponse{
		Pass:   res.Pass,
		Checks: mapChecks(res.Checks),
		Notes:  res.Notes,
	})
}

func (s *Server) handleSave(w http.ResponseWriter, r *http.Request, sid string) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	savedPath, err := s.eng.Save(r.Context(), sid)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, SaveResponse{SavedPath: savedPath})
}

func mapChecks(in []engine.CheckResult) []Check {
	out := make([]Check, 0, len(in))
	for _, c := range in {
		out = append(out, Check{Name: c.Name, Pass: c.Pass, Detail: c.Detail})
	}
	return out
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]any{"error": msg})
}

var errNotFound = errors.New("not found")
