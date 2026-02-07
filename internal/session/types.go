package session

import (
	"encoding/json"
	"time"
)

// Record represents a single line from a Claude Code JSONL session file.
type Record struct {
	Type         string          `json:"type"`
	UUID         string          `json:"uuid"`
	ParentUUID   *string         `json:"parentUuid"`
	SessionID    string          `json:"sessionId"`
	Timestamp    time.Time       `json:"timestamp"`
	Message      RawMessage      `json:"message"`
	IsMeta       bool            `json:"isMeta"`
	IsSidechain  bool            `json:"isSidechain"`
	CWD          string          `json:"cwd"`
	Version      string          `json:"version"`
	GitBranch    string          `json:"gitBranch"`
	ToolUseResult json.RawMessage `json:"toolUseResult,omitempty"`
}

// RawMessage holds the message field which has role, id, and content.
// Content can be a string OR an array of ContentBlock.
type RawMessage struct {
	Role    string          `json:"role"`
	ID      string          `json:"id"`
	Content json.RawMessage `json:"content"`
}

// ContentBlock represents a single block in an assistant message's content array.
type ContentBlock struct {
	Type string `json:"type"`

	// For type=text
	Text string `json:"text,omitempty"`

	// For type=thinking
	Thinking string `json:"thinking,omitempty"`

	// For type=tool_use
	ID    string          `json:"id,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`

	// For type=tool_result
	ToolUseID string          `json:"tool_use_id,omitempty"`
	Content   json.RawMessage `json:"content,omitempty"`
	IsError   bool            `json:"is_error,omitempty"`
}

// ToolUseResultData holds parsed tool result metadata.
type ToolUseResultData struct {
	Type            string           `json:"type,omitempty"`
	Stdout          string           `json:"stdout,omitempty"`
	Stderr          string           `json:"stderr,omitempty"`
	Interrupted     bool             `json:"interrupted,omitempty"`
	IsImage         bool             `json:"isImage,omitempty"`
	FilePath        string           `json:"filePath,omitempty"`
	Content         string           `json:"content,omitempty"`
	OriginalFile    string           `json:"originalFile,omitempty"`
	StructuredPatch []PatchFile      `json:"structuredPatch,omitempty"`
	// For Glob results
	Filenames []string `json:"filenames,omitempty"`
	NumFiles  int      `json:"numFiles,omitempty"`
	Truncated bool     `json:"truncated,omitempty"`
	// For Task/subagent results
	Status          string `json:"status,omitempty"`
	Prompt          string `json:"prompt,omitempty"`
	AgentID         string `json:"agentId,omitempty"`
	// For AskUserQuestion results
	Questions json.RawMessage `json:"questions,omitempty"`
	Answers   json.RawMessage `json:"answers,omitempty"`
	// For Read results
	File string `json:"file,omitempty"`
}

// PatchFile represents one file in a structured patch.
type PatchFile struct {
	OldFileName string      `json:"oldFileName"`
	NewFileName string      `json:"newFileName"`
	Hunks       []PatchHunk `json:"hunks"`
}

// PatchHunk represents a diff hunk.
type PatchHunk struct {
	OldStart int         `json:"oldStart"`
	OldLines int         `json:"oldLines"`
	NewStart int         `json:"newStart"`
	NewLines int         `json:"newLines"`
	Lines    []string    `json:"lines,omitempty"`
	Changes  []HunkChange `json:"changes,omitempty"`
}

// HunkChange represents a single line change in a hunk.
type HunkChange struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	OldLine int    `json:"oldLine,omitempty"`
	NewLine int    `json:"newLine,omitempty"`
}

// Message is the merged, display-ready representation of a conversation turn.
type Message struct {
	ID            string          `json:"id"`
	Role          string          `json:"role"`
	Timestamp     time.Time       `json:"timestamp"`
	Blocks        []ContentBlock  `json:"blocks"`
	// For user messages with string content
	TextContent   string          `json:"textContent,omitempty"`
	// For user tool_result messages
	ToolResults   []ToolResult    `json:"toolResults,omitempty"`
}

// ToolResult pairs a tool_result content block with its parsed toolUseResult metadata.
type ToolResult struct {
	ToolUseID string             `json:"toolUseId"`
	Content   string             `json:"content"`
	IsError   bool               `json:"isError,omitempty"`
	Result    *ToolUseResultData `json:"result,omitempty"`
}

// SessionInfo holds metadata about a discovered session.
type SessionInfo struct {
	ID          string    `json:"id"`
	ProjectDir  string    `json:"projectDir"`
	ProjectName string    `json:"projectName"`
	FilePath    string    `json:"filePath"`
	ModTime     time.Time `json:"modTime"`
	SizeBytes   int64     `json:"sizeBytes"`
}

// ParsedSession holds a fully parsed session.
type ParsedSession struct {
	Info     SessionInfo `json:"info"`
	Messages []Message  `json:"messages"`
}
