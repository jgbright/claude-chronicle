package manifest

// Manifest holds the edit manifest for a session.
type Manifest struct {
	Version   int    `json:"version"`
	SessionID string `json:"sessionId"`
	Edits     []Edit `json:"edits"`
}

// Edit represents a single curation operation.
type Edit struct {
	Type         string   `json:"type"`
	BlockID      string   `json:"blockId,omitempty"`
	BlockIDs     []string `json:"blockIds,omitempty"`
	Summary      string   `json:"summary,omitempty"`
	AfterBlockID string   `json:"afterBlockId,omitempty"`
	Content      string   `json:"content,omitempty"`
	ID           string   `json:"id,omitempty"`
	NewContent   string   `json:"newContent,omitempty"`
}
