package export

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

// --- SanitizeForExport integration tests ---

func TestSanitizeForExport_DeletesRemovedFromMessages(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{ID: "s1"},
			Messages: []session.Message{
				{ID: "msg-1", Role: "user", TextContent: "hello"},
				{ID: "msg-2", Role: "assistant", Blocks: []session.ContentBlock{
					{Type: "text", Text: "response"},
				}},
				{ID: "msg-3", Role: "user", TextContent: "follow up"},
			},
		},
		Manifest: &manifest.Manifest{
			Version:   1,
			SessionID: "s1",
			Edits: []manifest.Edit{
				{Type: "delete", BlockID: "msg-2"},
			},
		},
		Theme: "claude",
	}

	result := SanitizeForExport(data)

	if len(result.Session.Messages) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(result.Session.Messages))
	}
	for _, msg := range result.Session.Messages {
		if msg.ID == "msg-2" {
			t.Error("deleted message msg-2 should not be in sanitized output")
		}
	}
}

func TestSanitizeForExport_DeleteEditsStrippedFromManifest(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "s1"},
			Messages: []session.Message{{ID: "msg-1", Role: "user", TextContent: "hello"}},
		},
		Manifest: &manifest.Manifest{
			Version:   1,
			SessionID: "s1",
			Edits: []manifest.Edit{
				{Type: "delete", BlockID: "msg-1"},
				{Type: "annotate", AfterBlockID: "msg-2", Content: "note", ID: "a1"},
			},
		},
		Theme: "claude",
	}

	result := SanitizeForExport(data)

	if result.Manifest == nil {
		t.Fatal("expected manifest with remaining edits")
	}
	if len(result.Manifest.Edits) != 1 {
		t.Fatalf("expected 1 remaining edit, got %d", len(result.Manifest.Edits))
	}
	if result.Manifest.Edits[0].Type != "annotate" {
		t.Errorf("expected remaining edit to be annotate, got %s", result.Manifest.Edits[0].Type)
	}
}

func TestSanitizeForExport_AllDeletesYieldsNilManifest(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "s1"},
			Messages: []session.Message{{ID: "msg-1", Role: "user", TextContent: "hi"}},
		},
		Manifest: &manifest.Manifest{
			Version:   1,
			SessionID: "s1",
			Edits: []manifest.Edit{
				{Type: "delete", BlockID: "msg-1"},
			},
		},
		Theme: "claude",
	}

	result := SanitizeForExport(data)

	if result.Manifest != nil {
		t.Errorf("expected nil manifest when only delete edits present, got %+v", result.Manifest)
	}
}

func TestSanitizeForExport_NilManifest(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "s1"},
			Messages: []session.Message{{ID: "msg-1", Role: "user", TextContent: "hi"}},
		},
		Manifest: nil,
		Theme:    "claude",
	}

	result := SanitizeForExport(data)

	if len(result.Session.Messages) != 1 {
		t.Errorf("expected 1 message, got %d", len(result.Session.Messages))
	}
	if result.Manifest != nil {
		t.Error("expected nil manifest")
	}
}

func TestSanitizeForExport_DoesNotMutateOriginal(t *testing.T) {
	original := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{
				ID:       "s1",
				FilePath: "/home/user/sessions/s1.jsonl",
			},
			Messages: []session.Message{
				{ID: "msg-1", Role: "user", TextContent: "hello"},
				{ID: "msg-2", Role: "assistant"},
			},
		},
		Manifest: &manifest.Manifest{
			Version:   1,
			SessionID: "s1",
			Edits:     []manifest.Edit{{Type: "delete", BlockID: "msg-2"}},
		},
		Theme: "claude",
	}

	SanitizeForExport(original)

	if len(original.Session.Messages) != 2 {
		t.Error("original messages should not be modified")
	}
	if original.Session.Info.FilePath != "/home/user/sessions/s1.jsonl" {
		t.Error("original FilePath should not be modified")
	}
	if len(original.Manifest.Edits) != 1 {
		t.Error("original manifest should not be modified")
	}
}

// --- Metadata stripping tests ---

func TestSanitizeSessionInfo_ClearsFilePath(t *testing.T) {
	info := session.SessionInfo{
		ID:       "s1",
		FilePath: "/home/jdoe/.claude/projects/test/abc123.jsonl",
	}

	result := sanitizeSessionInfo(info)

	if result.FilePath != "" {
		t.Errorf("FilePath should be empty, got %q", result.FilePath)
	}
}

func TestSanitizeSessionInfo_ClearsProjectDir(t *testing.T) {
	info := session.SessionInfo{
		ID:         "s1",
		ProjectDir: "D--repos-claude-chronicle",
	}

	result := sanitizeSessionInfo(info)

	if result.ProjectDir != "" {
		t.Errorf("ProjectDir should be empty, got %q", result.ProjectDir)
	}
}

func TestSanitizeSessionInfo_TruncatesProjectName(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"D:/repos/claude-chronicle", "claude-chronicle"},
		{`C:\Users\John\projects\myapp`, "myapp"},
		{"/home/jdoe/work/secret-project", "secret-project"},
		{"simple-name", "simple-name"},
		{"", ""},
	}

	for _, tc := range tests {
		info := session.SessionInfo{ID: "s1", ProjectName: tc.input}
		result := sanitizeSessionInfo(info)
		if result.ProjectName != tc.want {
			t.Errorf("sanitizeSessionInfo(%q).ProjectName = %q, want %q", tc.input, result.ProjectName, tc.want)
		}
	}
}

func TestSanitizeSessionInfo_PreservesOtherFields(t *testing.T) {
	ts := time.Date(2024, 6, 15, 10, 0, 0, 0, time.UTC)
	info := session.SessionInfo{
		ID:          "abc-123",
		ProjectName: "/home/user/project",
		ModTime:     ts,
		SizeBytes:   42000,
	}

	result := sanitizeSessionInfo(info)

	if result.ID != "abc-123" {
		t.Errorf("ID = %q, want %q", result.ID, "abc-123")
	}
	if result.ModTime != ts {
		t.Errorf("ModTime changed")
	}
	if result.SizeBytes != 42000 {
		t.Errorf("SizeBytes = %d, want %d", result.SizeBytes, 42000)
	}
}

// --- Home directory path normalization tests ---

func TestNormalizeHomePaths(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "linux home path",
			input: "/home/jdoe/repos/myproject/src/main.go",
			want:  "~/repos/myproject/src/main.go",
		},
		{
			name:  "macOS home path",
			input: "/Users/jdoe/Documents/code/app.ts",
			want:  "~/Documents/code/app.ts",
		},
		{
			name:  "windows backslash path",
			input: `C:\Users\JohnDoe\repos\project\main.go`,
			want:  `~\repos\project\main.go`,
		},
		{
			name:  "windows path with forward slashes",
			input: "C:/Users/JohnDoe/repos/project/main.go",
			want:  "~/repos/project/main.go",
		},
		{
			name:  "no home path",
			input: "/usr/local/bin/go",
			want:  "/usr/local/bin/go",
		},
		{
			name:  "empty string",
			input: "",
			want:  "",
		},
		{
			name:  "multiple paths in one string",
			input: "Read /home/alice/file.txt and /home/bob/other.txt",
			want:  "Read ~/file.txt and ~/other.txt",
		},
		{
			name:  "path with spaces in username",
			input: "/home/john/work/project",
			want:  "~/work/project",
		},
		{
			name:  "windows drive letter case insensitive",
			input: `c:\Users\Admin\Desktop\file.txt`,
			want:  `~\Desktop\file.txt`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeHomePaths(tc.input)
			if got != tc.want {
				t.Errorf("normalizeHomePaths(%q) = %q, want %q", tc.input, got, tc.want)
			}
		})
	}
}

func TestSanitizeToolUseResultData_PathFields(t *testing.T) {
	data := session.ToolUseResultData{
		FilePath:     "/home/jdoe/project/src/main.go",
		OriginalFile: "/home/jdoe/project/src/main.go.bak",
		File:         "/home/jdoe/project/readme.md",
		Content:      "File at /home/jdoe/project/test.go",
		Stdout:       "Found: /home/jdoe/.env",
		Stderr:       "Warning: /home/jdoe/config",
		Filenames: []string{
			"/home/jdoe/project/a.go",
			"/home/jdoe/project/b.go",
		},
	}

	result := sanitizeToolUseResultData(data)

	if result.FilePath != "~/project/src/main.go" {
		t.Errorf("FilePath = %q", result.FilePath)
	}
	if result.OriginalFile != "~/project/src/main.go.bak" {
		t.Errorf("OriginalFile = %q", result.OriginalFile)
	}
	if result.File != "~/project/readme.md" {
		t.Errorf("File = %q", result.File)
	}
	if !strings.Contains(result.Content, "~/project/test.go") {
		t.Errorf("Content = %q", result.Content)
	}
	if !strings.Contains(result.Stdout, "~/.env") {
		t.Errorf("Stdout = %q", result.Stdout)
	}
	if !strings.Contains(result.Stderr, "~/config") {
		t.Errorf("Stderr = %q", result.Stderr)
	}
	if len(result.Filenames) != 2 || result.Filenames[0] != "~/project/a.go" {
		t.Errorf("Filenames = %v", result.Filenames)
	}
}

func TestSanitizeContentBlock_ToolUseInput(t *testing.T) {
	input := json.RawMessage(`{"file_path":"/home/jdoe/project/main.go","command":"cat /home/jdoe/.env"}`)
	block := session.ContentBlock{
		Type:  "tool_use",
		Name:  "Read",
		Input: input,
	}

	result := sanitizeContentBlock(block)

	var parsed map[string]string
	if err := json.Unmarshal(result.Input, &parsed); err != nil {
		t.Fatalf("failed to parse sanitized input: %v", err)
	}
	if parsed["file_path"] != "~/project/main.go" {
		t.Errorf("file_path = %q", parsed["file_path"])
	}
	if !strings.Contains(parsed["command"], "~/.env") {
		t.Errorf("command = %q", parsed["command"])
	}
}

func TestSanitizeContentBlock_TextAndThinking(t *testing.T) {
	block := session.ContentBlock{
		Type:     "thinking",
		Thinking: "The user's file is at /home/jdoe/secret/config.yaml",
		Text:     "I found the file at /Users/admin/project/src.go",
	}

	result := sanitizeContentBlock(block)

	if !strings.Contains(result.Thinking, "~/secret/config.yaml") {
		t.Errorf("Thinking = %q", result.Thinking)
	}
	if !strings.Contains(result.Text, "~/project/src.go") {
		t.Errorf("Text = %q", result.Text)
	}
}

// --- collectDeletedIDs tests ---

func TestCollectDeletedIDs(t *testing.T) {
	m := &manifest.Manifest{
		Edits: []manifest.Edit{
			{Type: "delete", BlockID: "a"},
			{Type: "collapse", BlockIDs: []string{"b", "c"}},
			{Type: "delete", BlockID: "d"},
		},
	}

	ids := collectDeletedIDs(m)

	if !ids["a"] || !ids["d"] {
		t.Errorf("expected a and d to be deleted, got %v", ids)
	}
	if ids["b"] || ids["c"] {
		t.Error("collapse IDs should not be in deleted set")
	}
}

func TestCollectDeletedIDs_NilManifest(t *testing.T) {
	ids := collectDeletedIDs(nil)
	if ids != nil {
		t.Errorf("expected nil for nil manifest, got %v", ids)
	}
}

// --- stripDeleteEdits tests ---

func TestStripDeleteEdits(t *testing.T) {
	m := &manifest.Manifest{
		Version:   1,
		SessionID: "s1",
		Edits: []manifest.Edit{
			{Type: "delete", BlockID: "a"},
			{Type: "annotate", AfterBlockID: "b", Content: "note", ID: "ann1"},
			{Type: "delete", BlockID: "c"},
			{Type: "editText", BlockID: "d", NewContent: "edited"},
		},
	}

	result := stripDeleteEdits(m)

	if result == nil {
		t.Fatal("expected non-nil manifest")
	}
	if len(result.Edits) != 2 {
		t.Fatalf("expected 2 edits, got %d", len(result.Edits))
	}
	if result.Edits[0].Type != "annotate" {
		t.Errorf("expected annotate, got %s", result.Edits[0].Type)
	}
	if result.Edits[1].Type != "editText" {
		t.Errorf("expected editText, got %s", result.Edits[1].Type)
	}
}

func TestStripDeleteEdits_AllDeletes(t *testing.T) {
	m := &manifest.Manifest{
		Edits: []manifest.Edit{
			{Type: "delete", BlockID: "a"},
		},
	}

	result := stripDeleteEdits(m)
	if result != nil {
		t.Error("expected nil when all edits are deletes")
	}
}

func TestStripDeleteEdits_NilManifest(t *testing.T) {
	result := stripDeleteEdits(nil)
	if result != nil {
		t.Error("expected nil for nil input")
	}
}

// --- Integration: HTML source verification ---

func TestGenerateHTML_DeletedContentNotInHTMLSource(t *testing.T) {
	secretContent := "super-secret-api-key-12345"
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{ID: "s1"},
			Messages: []session.Message{
				{ID: "msg-1", Role: "user", TextContent: "show me the key"},
				{ID: "msg-2", Role: "assistant", Blocks: []session.ContentBlock{
					{Type: "text", Text: secretContent},
				}},
			},
		},
		Manifest: &manifest.Manifest{
			Version:   1,
			SessionID: "s1",
			Edits:     []manifest.Edit{{Type: "delete", BlockID: "msg-2"}},
		},
		Theme: "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if strings.Contains(htmlStr, secretContent) {
		t.Error("deleted message content should NOT appear in HTML source")
	}
	if !strings.Contains(htmlStr, "show me the key") {
		t.Error("non-deleted message should still appear")
	}
}

func TestGenerateHTML_FilePathNotInHTMLSource(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{
				ID:       "s1",
				FilePath: "/home/secretuser/.claude/projects/test/s1.jsonl",
			},
			Messages: []session.Message{},
		},
		Theme: "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if strings.Contains(htmlStr, ".claude/projects") {
		t.Error("FilePath should not appear in HTML source")
	}
	if strings.Contains(htmlStr, "secretuser") {
		t.Error("username from FilePath should not appear in HTML source")
	}
}

func TestGenerateHTML_ProjectNameTruncatedInHTMLSource(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{
				ID:          "s1",
				ProjectName: "D:/repos/my-secret-corp/internal-tool",
			},
			Messages: []session.Message{},
		},
		Theme: "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if strings.Contains(htmlStr, "my-secret-corp") {
		t.Error("parent directory should not appear in HTML source")
	}
	if !strings.Contains(htmlStr, "internal-tool") {
		t.Error("leaf project name should appear in HTML source")
	}
}

func TestGenerateHTML_HomePathsNormalizedInHTMLSource(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{ID: "s1"},
			Messages: []session.Message{
				{
					ID:   "msg-1",
					Role: "user",
					ToolResults: []session.ToolResult{
						{
							ToolUseID: "tu1",
							Result: &session.ToolUseResultData{
								FilePath: "/home/jdoe/repos/project/main.go",
							},
						},
					},
				},
			},
		},
		Theme: "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if strings.Contains(htmlStr, "jdoe") {
		t.Error("username 'jdoe' should not appear in HTML source")
	}
	if !strings.Contains(htmlStr, "~/repos/project/main.go") {
		t.Error("path should be normalized to ~/")
	}
}

func TestSanitizeForExport_NilSession(t *testing.T) {
	data := &ExportData{
		Session: nil,
		Theme:   "claude",
	}

	result := SanitizeForExport(data)
	if result.Session != nil {
		t.Error("expected nil session")
	}
}

func TestSanitizeForExport_EmptyMessages(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "s1"},
			Messages: []session.Message{},
		},
		Theme: "claude",
	}

	result := SanitizeForExport(data)
	if result.Session.Messages == nil {
		t.Error("messages should be non-nil empty slice, not nil")
	}
	if len(result.Session.Messages) != 0 {
		t.Errorf("expected 0 messages, got %d", len(result.Session.Messages))
	}
}

func TestSanitizeForExport_PatchFilePathsNormalized(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{ID: "s1"},
			Messages: []session.Message{
				{
					ID:   "msg-1",
					Role: "user",
					ToolResults: []session.ToolResult{
						{
							ToolUseID: "tu1",
							Result: &session.ToolUseResultData{
								StructuredPatch: []session.PatchFile{
									{
										OldFileName: "/home/jdoe/project/old.go",
										NewFileName: "/home/jdoe/project/new.go",
									},
								},
							},
						},
					},
				},
			},
		},
		Theme: "claude",
	}

	result := SanitizeForExport(data)

	patch := result.Session.Messages[0].ToolResults[0].Result.StructuredPatch[0]
	if strings.Contains(patch.OldFileName, "jdoe") {
		t.Errorf("OldFileName should be normalized, got %q", patch.OldFileName)
	}
	if strings.Contains(patch.NewFileName, "jdoe") {
		t.Errorf("NewFileName should be normalized, got %q", patch.NewFileName)
	}
}
