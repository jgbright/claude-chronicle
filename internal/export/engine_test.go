package export

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

const testTemplate = `<!DOCTYPE html>
<html data-theme="claude">
<head><title>Chronicle Export</title></head>
<body>
<script>window.__CHRONICLE_DATA__={}</script>
</body>
</html>`

func TestGenerateHTML(t *testing.T) {
	t.Run("basic replacement", func(t *testing.T) {
		data := &ExportData{
			Session: &session.ParsedSession{
				Info: session.SessionInfo{ID: "test-1"},
				Messages: []session.Message{
					{
						ID:          "msg-1",
						Role:        "user",
						TextContent: "Hello",
						Timestamp:   time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC),
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
		if strings.Contains(htmlStr, "window.__CHRONICLE_DATA__={}") {
			t.Error("placeholder was not replaced")
		}
		if !strings.Contains(htmlStr, "test-1") {
			t.Error("expected session ID in output")
		}
		if !strings.Contains(htmlStr, "Hello") {
			t.Error("expected message content in output")
		}
	})

	t.Run("theme replacement", func(t *testing.T) {
		data := &ExportData{
			Session: &session.ParsedSession{
				Info:     session.SessionInfo{ID: "t1"},
				Messages: []session.Message{},
			},
			Theme: "copilot",
		}

		html, err := GenerateHTML([]byte(testTemplate), data)
		if err != nil {
			t.Fatal(err)
		}

		htmlStr := string(html)
		if !strings.Contains(htmlStr, `data-theme="copilot"`) {
			t.Error("expected data-theme to be set to copilot")
		}
		if strings.Contains(htmlStr, `data-theme="claude"`) {
			t.Error("original claude theme should be replaced")
		}
	})

	t.Run("missing placeholder returns template with data unchanged", func(t *testing.T) {
		noPlaceholder := `<!DOCTYPE html><html><body>No placeholder here</body></html>`
		data := &ExportData{
			Session: &session.ParsedSession{
				Info:     session.SessionInfo{ID: "t2"},
				Messages: []session.Message{},
			},
			Theme: "claude",
		}

		html, err := GenerateHTML([]byte(noPlaceholder), data)
		if err != nil {
			t.Fatal(err)
		}

		// The data won't be injected since there's no placeholder
		if strings.Contains(string(html), "t2") {
			t.Error("data should not appear when placeholder is missing")
		}
	})

	t.Run("special characters in content", func(t *testing.T) {
		data := &ExportData{
			Session: &session.ParsedSession{
				Info: session.SessionInfo{ID: "special"},
				Messages: []session.Message{
					{
						ID:          "msg-s",
						Role:        "user",
						TextContent: `He said "hello" & <world>`,
						Timestamp:   time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC),
					},
				},
			},
			Theme: "claude",
		}

		html, err := GenerateHTML([]byte(testTemplate), data)
		if err != nil {
			t.Fatal(err)
		}

		// The content is JSON-encoded inside the script tag
		if !strings.Contains(string(html), "special") {
			t.Error("expected session ID in output")
		}
	})

	t.Run("with manifest data", func(t *testing.T) {
		data := &ExportData{
			Session: &session.ParsedSession{
				Info:     session.SessionInfo{ID: "with-manifest"},
				Messages: []session.Message{},
			},
			Manifest: &manifest.Manifest{
				Version:   1,
				SessionID: "with-manifest",
				Edits: []manifest.Edit{
					{Type: "delete", BlockID: "b1"},
				},
			},
			Theme: "claude",
		}

		html, err := GenerateHTML([]byte(testTemplate), data)
		if err != nil {
			t.Fatal(err)
		}

		if !strings.Contains(string(html), "with-manifest") {
			t.Error("expected manifest data in output")
		}
		if !strings.Contains(string(html), "delete") {
			t.Error("expected edit type in output")
		}
	})
}

func TestGenerateHTMLRoundTrip(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info: session.SessionInfo{
				ID:          "roundtrip-id",
				ProjectName: "test-project",
			},
			Messages: []session.Message{
				{
					ID:          "u1",
					Role:        "user",
					TextContent: "What is Go?",
					Timestamp:   time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC),
				},
				{
					ID:   "a1",
					Role: "assistant",
					Blocks: []session.ContentBlock{
						{Type: "text", Text: "Go is a programming language."},
					},
					Timestamp: time.Date(2024, 1, 15, 10, 1, 0, 0, time.UTC),
				},
			},
		},
		Theme: "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	// Extract the JSON from the generated HTML
	htmlStr := string(html)
	prefix := "window.__CHRONICLE_DATA__="
	startIdx := strings.Index(htmlStr, prefix)
	if startIdx == -1 {
		t.Fatal("could not find data prefix in output")
	}
	startIdx += len(prefix)

	// Find the closing </script>
	endIdx := strings.Index(htmlStr[startIdx:], "</script>")
	if endIdx == -1 {
		t.Fatal("could not find closing script tag")
	}

	jsonStr := htmlStr[startIdx : startIdx+endIdx]

	var extracted ExportData
	if err := json.Unmarshal([]byte(jsonStr), &extracted); err != nil {
		t.Fatalf("failed to parse extracted JSON: %v", err)
	}

	if extracted.Session.Info.ID != "roundtrip-id" {
		t.Errorf("extracted ID = %q, want %q", extracted.Session.Info.ID, "roundtrip-id")
	}
	if len(extracted.Session.Messages) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(extracted.Session.Messages))
	}
	if extracted.Session.Messages[0].TextContent != "What is Go?" {
		t.Errorf("msg[0].TextContent = %q, want %q", extracted.Session.Messages[0].TextContent, "What is Go?")
	}
	if extracted.Theme != "claude" {
		t.Errorf("Theme = %q, want %q", extracted.Theme, "claude")
	}
}

func TestGenerateHTMLInvalidThemeFallsBackToClaude(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "xss-test"},
			Messages: []session.Message{},
		},
		Theme: `claude" onload="alert(1)`,
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if strings.Contains(htmlStr, "onload") {
		t.Error("invalid theme value should not appear in output")
	}
	if !strings.Contains(htmlStr, `data-theme="claude"`) {
		t.Error("expected fallback to claude theme")
	}
}

func TestGenerateHTMLNilManifest(t *testing.T) {
	data := &ExportData{
		Session: &session.ParsedSession{
			Info:     session.SessionInfo{ID: "nil-manifest"},
			Messages: []session.Message{},
		},
		Manifest: nil,
		Theme:    "claude",
	}

	html, err := GenerateHTML([]byte(testTemplate), data)
	if err != nil {
		t.Fatal(err)
	}

	htmlStr := string(html)
	if !strings.Contains(htmlStr, "nil-manifest") {
		t.Error("expected session data in output")
	}
	// manifest should be null in JSON
	if !strings.Contains(htmlStr, `"manifest":null`) {
		t.Error("expected manifest to be null in JSON")
	}
}
