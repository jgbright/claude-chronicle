package export

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

// homePathPattern matches OS-specific home directory paths containing a username.
// Captures: C:\Users\<name>\, C:/Users/<name>/, /home/<name>/, /Users/<name>/
var homePathPattern = regexp.MustCompile(
	`(?i)` +
		`(?:[A-Z]:\\Users\\[^\\\/\s]+\\)` + // Windows backslash: C:\Users\name\
		`|(?:[A-Z]:/Users/[^/\s]+/)` + // Windows forward slash: C:/Users/name/
		`|(?:/home/[^/\s]+/)` + // Linux: /home/name/
		`|(?:/Users/[^/\s]+/)`, // macOS: /Users/name/
)

// SanitizeForExport applies server-side sanitization to export data:
// 1. Applies manifest delete edits (physically removes messages)
// 2. Strips sensitive metadata from SessionInfo
// 3. Normalizes home directory paths to ~/ or ~\
//
// The returned data is a deep copy safe for JSON serialization into HTML.
// The original data is not modified.
func SanitizeForExport(data *ExportData) *ExportData {
	result := &ExportData{
		Theme: data.Theme,
	}

	if data.Session != nil {
		sanitized := sanitizeSession(data.Session, data.Manifest)
		result.Session = sanitized
	}

	// Manifest is still included (for collapse/annotate/editText rendering),
	// but delete edits are removed since they've been applied server-side.
	result.Manifest = stripDeleteEdits(data.Manifest)

	return result
}

// sanitizeSession creates a sanitized copy of the session.
func sanitizeSession(s *session.ParsedSession, m *manifest.Manifest) *session.ParsedSession {
	result := &session.ParsedSession{
		Info: sanitizeSessionInfo(s.Info),
	}

	// Collect message IDs targeted by delete edits
	deleted := collectDeletedIDs(m)

	// Copy messages, skipping deleted ones
	for _, msg := range s.Messages {
		if deleted[msg.ID] {
			continue
		}
		sanitizedMsg := sanitizeMessage(msg)
		result.Messages = append(result.Messages, sanitizedMsg)
	}

	if result.Messages == nil {
		result.Messages = []session.Message{}
	}

	return result
}

// sanitizeSessionInfo strips sensitive fields from session metadata.
func sanitizeSessionInfo(info session.SessionInfo) session.SessionInfo {
	result := info

	// FilePath is the absolute path to the JSONL file on disk — never needed in exports
	result.FilePath = ""

	// ProjectDir is the raw directory name — clear it
	result.ProjectDir = ""

	// Truncate ProjectName to just the leaf directory name
	// e.g. "D:/repos/claude-chronicle" → "claude-chronicle"
	if result.ProjectName != "" {
		// Handle both forward and backslash separators
		name := result.ProjectName
		name = strings.ReplaceAll(name, "\\", "/")
		if idx := strings.LastIndex(name, "/"); idx >= 0 {
			name = name[idx+1:]
		}
		result.ProjectName = name
	}

	return result
}

// sanitizeMessage creates a copy of the message with paths normalized.
func sanitizeMessage(msg session.Message) session.Message {
	result := msg

	// Sanitize text content (user prompts may contain paths)
	result.TextContent = normalizeHomePaths(msg.TextContent)

	// Sanitize tool results
	if len(msg.ToolResults) > 0 {
		result.ToolResults = make([]session.ToolResult, len(msg.ToolResults))
		for i, tr := range msg.ToolResults {
			result.ToolResults[i] = sanitizeToolResult(tr)
		}
	}

	// Sanitize assistant content blocks
	if len(msg.Blocks) > 0 {
		result.Blocks = make([]session.ContentBlock, len(msg.Blocks))
		for i, block := range msg.Blocks {
			result.Blocks[i] = sanitizeContentBlock(block)
		}
	}

	return result
}

// sanitizeToolResult normalizes paths in tool result data.
func sanitizeToolResult(tr session.ToolResult) session.ToolResult {
	result := tr
	result.Content = normalizeHomePaths(tr.Content)

	if tr.Result != nil {
		sanitized := sanitizeToolUseResultData(*tr.Result)
		result.Result = &sanitized
	}

	return result
}

// sanitizeToolUseResultData normalizes paths in structured tool result metadata.
func sanitizeToolUseResultData(data session.ToolUseResultData) session.ToolUseResultData {
	result := data

	result.FilePath = normalizeHomePaths(data.FilePath)
	result.OriginalFile = normalizeHomePaths(data.OriginalFile)
	result.File = normalizeHomePaths(data.File)
	result.Content = normalizeHomePaths(data.Content)
	result.Stdout = normalizeHomePaths(data.Stdout)
	result.Stderr = normalizeHomePaths(data.Stderr)
	result.Prompt = normalizeHomePaths(data.Prompt)

	if len(data.Filenames) > 0 {
		result.Filenames = make([]string, len(data.Filenames))
		for i, f := range data.Filenames {
			result.Filenames[i] = normalizeHomePaths(f)
		}
	}

	// Normalize paths in structured patches
	if len(data.StructuredPatch) > 0 {
		result.StructuredPatch = make([]session.PatchFile, len(data.StructuredPatch))
		for i, pf := range data.StructuredPatch {
			result.StructuredPatch[i] = session.PatchFile{
				OldFileName: normalizeHomePaths(pf.OldFileName),
				NewFileName: normalizeHomePaths(pf.NewFileName),
				Hunks:       pf.Hunks, // hunk content doesn't typically contain full paths
			}
		}
	}

	return result
}

// sanitizeContentBlock normalizes paths in assistant content blocks.
func sanitizeContentBlock(block session.ContentBlock) session.ContentBlock {
	result := block

	result.Text = normalizeHomePaths(block.Text)
	result.Thinking = normalizeHomePaths(block.Thinking)

	// Normalize paths in tool_use input JSON
	if len(block.Input) > 0 {
		result.Input = normalizeHomePathsInJSON(block.Input)
	}

	return result
}

// normalizeHomePaths replaces OS-specific home directory paths with ~/ or ~\.
func normalizeHomePaths(s string) string {
	if s == "" {
		return s
	}

	return homePathPattern.ReplaceAllStringFunc(s, func(match string) string {
		// Determine the separator used in the match
		if strings.Contains(match, "\\") {
			return `~\`
		}
		return "~/"
	})
}

// normalizeHomePathsInJSON normalizes home directory paths within JSON values.
// It parses the JSON, walks string values, and re-marshals.
func normalizeHomePathsInJSON(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return raw
	}

	// Try as object (most common for tool_use input)
	var obj map[string]interface{}
	if err := json.Unmarshal(raw, &obj); err == nil {
		normalizeJSONValue(obj)
		if result, err := json.Marshal(obj); err == nil {
			return result
		}
	}

	return raw
}

// normalizeJSONValue recursively normalizes string values in a JSON structure.
func normalizeJSONValue(v interface{}) {
	switch val := v.(type) {
	case map[string]interface{}:
		for k, v := range val {
			if s, ok := v.(string); ok {
				val[k] = normalizeHomePaths(s)
			} else {
				normalizeJSONValue(v)
			}
		}
	case []interface{}:
		for i, v := range val {
			if s, ok := v.(string); ok {
				val[i] = normalizeHomePaths(s)
			} else {
				normalizeJSONValue(v)
			}
		}
	}
}

// collectDeletedIDs returns a set of message IDs targeted by delete edits.
func collectDeletedIDs(m *manifest.Manifest) map[string]bool {
	if m == nil || len(m.Edits) == 0 {
		return nil
	}

	deleted := make(map[string]bool)
	for _, edit := range m.Edits {
		if edit.Type == "delete" && edit.BlockID != "" {
			deleted[edit.BlockID] = true
		}
	}
	return deleted
}

// stripDeleteEdits returns a manifest copy without delete edits,
// since they've been applied server-side. Returns nil if no edits or metadata remain.
func stripDeleteEdits(m *manifest.Manifest) *manifest.Manifest {
	if m == nil {
		return nil
	}

	var remaining []manifest.Edit
	for _, edit := range m.Edits {
		if edit.Type != "delete" {
			remaining = append(remaining, edit)
		}
	}

	if len(remaining) == 0 && m.Metadata == nil {
		return nil
	}

	result := &manifest.Manifest{
		Version:   m.Version,
		SessionID: m.SessionID,
		Metadata:  m.Metadata,
		Edits:     remaining,
	}
	if result.Edits == nil {
		result.Edits = []manifest.Edit{}
	}
	return result
}

