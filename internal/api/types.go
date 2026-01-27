package api

type CreateSessionRequest struct {
	// repo_id is optional (useful if you support multiple repos later)
	RepoID string `json:"repo_id,omitempty"`

	// prompt_path is relative to workspace root, e.g. "repoA/prompts/system.md"
	PromptPath string `json:"prompt_path"`

	// optional: initial context fixture path relative to workspace
	ContextPath string `json:"context_path,omitempty"`
}

type CreateSessionResponse struct {
	SessionID string `json:"session_id"`
}

type UpdatePromptRequest struct {
	Text string `json:"text"`
}

type GetPromptResponse struct {
	Baseline string `json:"baseline"`
	Working  string `json:"working"`
}

type RunRequest struct {
	// Free-form input message
	Input string `json:"input"`

	// Optional: structured context, variables, etc.
	Vars map[string]any `json:"vars,omitempty"`
}

type RunResponse struct {
	RunID  string `json:"run_id"`
	Output string `json:"output"`
}

type VerifyResponse struct {
	Pass   bool     `json:"pass"`
	Checks []Check  `json:"checks"`
	Notes  []string `json:"notes,omitempty"`
}

type Check struct {
	Name   string `json:"name"`
	Pass   bool   `json:"pass"`
	Detail string `json:"detail,omitempty"`
}

type SaveResponse struct {
	SavedPath string `json:"saved_path"`
}
