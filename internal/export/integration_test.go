package export

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

// TestIntegrationExportPipeline tests the full export pipeline:
// JSONL parse → manifest with deletes → sanitize → generate HTML.
func TestIntegrationExportPipeline(t *testing.T) {
	fixturePath := filepath.Join("testdata", "integration.jsonl")

	// Step 1: Parse the JSONL fixture
	parsed, err := session.ParseFile(fixturePath)
	if err != nil {
		t.Fatalf("ParseFile failed: %v", err)
	}

	if len(parsed.Messages) == 0 {
		t.Fatal("expected messages from fixture, got 0")
	}

	// Verify we got all expected messages.
	// Note: user message IDs come from rec.UUID, assistant IDs from rec.Message.ID.
	msgIDs := make(map[string]bool)
	for _, msg := range parsed.Messages {
		msgIDs[msg.ID] = true
	}
	// User messages use UUID: r1, r3, r5; assistant messages use message.id: msg-asst-1, etc.
	for _, expected := range []string{"r1", "msg-asst-1", "r3", "msg-asst-2", "r5", "msg-asst-3"} {
		if !msgIDs[expected] {
			t.Errorf("expected message %q not found in parsed output", expected)
		}
	}

	// Step 2: Create a manifest that deletes the second exchange (r3 + msg-asst-2)
	m := &manifest.Manifest{
		Version:   1,
		SessionID: "integ-test",
		Edits: []manifest.Edit{
			{Type: "delete", BlockID: "r3"},
			{Type: "delete", BlockID: "msg-asst-2"},
			{Type: "annotate", AfterBlockID: "msg-asst-1", Content: "Great start!", ID: "ann-1"},
		},
	}

	// Step 3: Build export data and generate HTML
	data := &ExportData{
		Session:  parsed,
		Manifest: m,
		Theme:    "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatalf("GenerateHTML failed: %v", err)
	}
	htmlStr := string(html)

	// Step 4: Extract and parse the injected JSON
	prefix := "window.__CHRONICLE_DATA__="
	startIdx := strings.Index(htmlStr, prefix)
	if startIdx == -1 {
		t.Fatal("could not find data prefix in output")
	}
	startIdx += len(prefix)

	endIdx := strings.Index(htmlStr[startIdx:], "</script>")
	if endIdx == -1 {
		t.Fatal("could not find closing script tag")
	}

	jsonStr := htmlStr[startIdx : startIdx+endIdx]

	var exported ExportData
	if err := json.Unmarshal([]byte(jsonStr), &exported); err != nil {
		t.Fatalf("failed to parse extracted JSON: %v\nJSON: %s", err, jsonStr[:min(len(jsonStr), 500)])
	}

	// === Assertions ===

	// A. Deleted messages are physically absent
	for _, msg := range exported.Session.Messages {
		if msg.ID == "r3" || msg.ID == "msg-asst-2" {
			t.Errorf("deleted message %q should not appear in export", msg.ID)
		}
	}

	// B. Non-deleted messages are present
	exportedIDs := make(map[string]bool)
	for _, msg := range exported.Session.Messages {
		exportedIDs[msg.ID] = true
	}
	for _, expected := range []string{"r1", "msg-asst-1", "r5", "msg-asst-3"} {
		if !exportedIDs[expected] {
			t.Errorf("non-deleted message %q should be present in export", expected)
		}
	}

	// C. Deleted content text does not appear anywhere in the HTML
	if strings.Contains(htmlStr, "This message should be deleted") {
		t.Error("deleted user message content should not appear in HTML")
	}
	if strings.Contains(htmlStr, "This response should also be deleted") {
		t.Error("deleted assistant message content should not appear in HTML")
	}

	// D. Home directory paths are normalized
	if strings.Contains(htmlStr, "C:/Users/TestUser/") {
		t.Error("Windows home path should be normalized to ~/")
	}
	if strings.Contains(htmlStr, "/home/testuser/") {
		t.Error("Linux home path should be normalized to ~/")
	}
	if strings.Contains(htmlStr, "/Users/TestUser/") {
		t.Error("macOS home path should be normalized to ~/")
	}
	// Normalized paths should be present
	if !strings.Contains(htmlStr, "~/") {
		t.Error("expected normalized ~/ paths in output")
	}

	// E. Session metadata is stripped
	if exported.Session.Info.FilePath != "" {
		t.Errorf("FilePath should be stripped, got %q", exported.Session.Info.FilePath)
	}
	if exported.Session.Info.ProjectDir != "" {
		t.Errorf("ProjectDir should be stripped, got %q", exported.Session.Info.ProjectDir)
	}

	// F. Delete edits are removed from the manifest, but annotate edits remain
	if exported.Manifest == nil {
		t.Fatal("expected manifest in export (has non-delete edits)")
	}
	for _, edit := range exported.Manifest.Edits {
		if edit.Type == "delete" {
			t.Error("delete edits should be stripped from exported manifest")
		}
	}
	hasAnnotate := false
	for _, edit := range exported.Manifest.Edits {
		if edit.Type == "annotate" {
			hasAnnotate = true
		}
	}
	if !hasAnnotate {
		t.Error("annotate edit should remain in exported manifest")
	}

	// G. Theme is set correctly
	if !strings.Contains(htmlStr, `data-theme="claude"`) {
		t.Error("expected claude theme in output")
	}
}
