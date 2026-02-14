package session

import "testing"

func TestSearchContent(t *testing.T) {
	mkSession := func(title string, msgs ...Message) *ParsedSession {
		return &ParsedSession{
			Info:     SessionInfo{Title: title},
			Messages: msgs,
		}
	}

	t.Run("match in user TextContent", func(t *testing.T) {
		s := mkSession("", Message{Role: "user", TextContent: "Fix the login bug"})
		if !SearchContent(s, "login") {
			t.Error("expected match in user TextContent")
		}
	})

	t.Run("match in assistant text block", func(t *testing.T) {
		s := mkSession("", Message{
			Role: "assistant",
			Blocks: []ContentBlock{
				{Type: "text", Text: "Here is the solution"},
			},
		})
		if !SearchContent(s, "solution") {
			t.Error("expected match in assistant text block")
		}
	})

	t.Run("match in tool result content", func(t *testing.T) {
		s := mkSession("", Message{
			Role: "user",
			ToolResults: []ToolResult{
				{Content: "Error: file not found"},
			},
		})
		if !SearchContent(s, "file not found") {
			t.Error("expected match in tool result content")
		}
	})

	t.Run("match in session title", func(t *testing.T) {
		s := mkSession("Debugging auth flow", Message{Role: "user", TextContent: "hello"})
		if !SearchContent(s, "auth flow") {
			t.Error("expected match in session title")
		}
	})

	t.Run("case insensitive matching", func(t *testing.T) {
		s := mkSession("", Message{Role: "user", TextContent: "Fix the LOGIN Bug"})
		if !SearchContent(s, "login bug") {
			t.Error("expected case-insensitive match")
		}
	})

	t.Run("no match returns false", func(t *testing.T) {
		s := mkSession("My Title", Message{
			Role:        "user",
			TextContent: "hello world",
		}, Message{
			Role:   "assistant",
			Blocks: []ContentBlock{{Type: "text", Text: "goodbye"}},
		})
		if SearchContent(s, "nonexistent") {
			t.Error("expected no match")
		}
	})

	t.Run("skips non-text blocks", func(t *testing.T) {
		s := mkSession("", Message{
			Role: "assistant",
			Blocks: []ContentBlock{
				{Type: "thinking", Thinking: "secret thinking"},
				{Type: "tool_use", Name: "Bash"},
			},
		})
		if SearchContent(s, "secret") {
			t.Error("expected no match in thinking blocks")
		}
	})
}
