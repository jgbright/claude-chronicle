package manifest

import "fmt"

// Metadata holds optional session-level overrides.
type Metadata struct {
	Title   string `json:"title,omitempty"`
	Deleted bool   `json:"deleted,omitempty"`
}

// Manifest holds the edit manifest for a session.
type Manifest struct {
	Version   int       `json:"version"`
	SessionID string    `json:"sessionId"`
	Metadata  *Metadata `json:"metadata,omitempty"`
	Edits     []Edit    `json:"edits"`
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

// validEditTypes lists all recognized edit types.
var validEditTypes = map[string]bool{
	"delete":   true,
	"collapse": true,
	"annotate": true,
	"editText": true,
	"reorder":  true,
}

// Validate checks that the edit has a valid type and all required fields.
func (e *Edit) Validate() error {
	if !validEditTypes[e.Type] {
		return fmt.Errorf("invalid edit type: %q", e.Type)
	}

	switch e.Type {
	case "delete":
		if e.BlockID == "" {
			return fmt.Errorf("delete edit requires blockId")
		}
	case "collapse":
		if len(e.BlockIDs) == 0 {
			return fmt.Errorf("collapse edit requires non-empty blockIds")
		}
		if e.Summary == "" {
			return fmt.Errorf("collapse edit requires summary")
		}
	case "annotate":
		if e.AfterBlockID == "" {
			return fmt.Errorf("annotate edit requires afterBlockId")
		}
		if e.Content == "" {
			return fmt.Errorf("annotate edit requires content")
		}
	case "editText":
		if e.BlockID == "" {
			return fmt.Errorf("editText edit requires blockId")
		}
		if e.NewContent == "" {
			return fmt.Errorf("editText edit requires newContent")
		}
	case "reorder":
		// Support both payloads:
		// 1) legacy: {blockIds:[...]}
		// 2) frontend schema: {blockId:"...", afterBlockId:"..."}
		if len(e.BlockIDs) == 0 {
			if e.BlockID == "" {
				return fmt.Errorf("reorder edit requires blockId or non-empty blockIds")
			}
			if e.AfterBlockID == "" {
				return fmt.Errorf("reorder edit requires afterBlockId when using blockId")
			}
		}
	}

	return nil
}
