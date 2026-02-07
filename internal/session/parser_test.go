package session

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestParseContentBlocks(t *testing.T) {
	tests := []struct {
		name     string
		raw      json.RawMessage
		wantLen  int
		wantType string
		wantText string
	}{
		{
			name:    "nil input",
			raw:     nil,
			wantLen: 0,
		},
		{
			name:    "empty input",
			raw:     json.RawMessage{},
			wantLen: 0,
		},
		{
			name:     "string content",
			raw:      json.RawMessage(`"hello world"`),
			wantLen:  1,
			wantType: "text",
			wantText: "hello world",
		},
		{
			name:    "empty string",
			raw:     json.RawMessage(`""`),
			wantLen: 0,
		},
		{
			name:     "array of text blocks",
			raw:      json.RawMessage(`[{"type":"text","text":"hello"},{"type":"text","text":"world"}]`),
			wantLen:  2,
			wantType: "text",
			wantText: "hello",
		},
		{
			name:     "tool_use block",
			raw:      json.RawMessage(`[{"type":"tool_use","id":"tu_123","name":"Read","input":{"path":"foo.go"}}]`),
			wantLen:  1,
			wantType: "tool_use",
		},
		{
			name:    "invalid JSON",
			raw:     json.RawMessage(`{not json`),
			wantLen: 0,
		},
		{
			name:    "non-string non-array JSON (number)",
			raw:     json.RawMessage(`42`),
			wantLen: 0,
		},
		{
			name:    "non-string non-array JSON (bool)",
			raw:     json.RawMessage(`true`),
			wantLen: 0,
		},
		{
			name:    "non-string non-array JSON (object)",
			raw:     json.RawMessage(`{"key":"value"}`),
			wantLen: 0,
		},
		{
			name:     "thinking block",
			raw:      json.RawMessage(`[{"type":"thinking","thinking":"Let me think..."}]`),
			wantLen:  1,
			wantType: "thinking",
		},
		{
			name:    "empty array",
			raw:     json.RawMessage(`[]`),
			wantLen: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			blocks := parseContentBlocks(tt.raw)
			if len(blocks) != tt.wantLen {
				t.Fatalf("got %d blocks, want %d", len(blocks), tt.wantLen)
			}
			if tt.wantLen > 0 {
				if blocks[0].Type != tt.wantType {
					t.Errorf("block[0].Type = %q, want %q", blocks[0].Type, tt.wantType)
				}
				if tt.wantText != "" && blocks[0].Text != tt.wantText {
					t.Errorf("block[0].Text = %q, want %q", blocks[0].Text, tt.wantText)
				}
			}
		})
	}
}

func TestShouldSkipRecord(t *testing.T) {
	tests := []struct {
		name string
		rec  Record
		want bool
	}{
		{
			name: "normal user record",
			rec:  Record{Type: "message", Message: RawMessage{Role: "user"}},
			want: false,
		},
		{
			name: "normal assistant record",
			rec:  Record{Type: "message", Message: RawMessage{Role: "assistant"}},
			want: false,
		},
		{
			name: "file-history-snapshot",
			rec:  Record{Type: "file-history-snapshot", Message: RawMessage{Role: "user"}},
			want: true,
		},
		{
			name: "progress",
			rec:  Record{Type: "progress", Message: RawMessage{Role: "assistant"}},
			want: true,
		},
		{
			name: "isMeta true",
			rec:  Record{Type: "message", IsMeta: true, Message: RawMessage{Role: "user"}},
			want: true,
		},
		{
			name: "empty role",
			rec:  Record{Type: "message", Message: RawMessage{Role: ""}},
			want: true,
		},
		{
			name: "isMeta with file-history-snapshot",
			rec:  Record{Type: "file-history-snapshot", IsMeta: true, Message: RawMessage{Role: "user"}},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shouldSkipRecord(&tt.rec)
			if got != tt.want {
				t.Errorf("shouldSkipRecord() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParseUserRecord(t *testing.T) {
	ts := time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)

	tests := []struct {
		name            string
		rec             Record
		wantNil         bool
		wantTextContent string
		wantToolResults int
	}{
		{
			name: "plain text content",
			rec: Record{
				UUID:      "uuid-1",
				Timestamp: ts,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"Hello, Claude!"`),
				},
			},
			wantTextContent: "Hello, Claude!",
		},
		{
			name: "empty content",
			rec: Record{
				UUID:    "uuid-2",
				Message: RawMessage{Role: "user", Content: json.RawMessage{}},
			},
			wantNil: true,
		},
		{
			name: "nil content",
			rec: Record{
				UUID:    "uuid-3",
				Message: RawMessage{Role: "user", Content: nil},
			},
			wantNil: true,
		},
		{
			name: "local-command prefix skipped",
			rec: Record{
				UUID: "uuid-4",
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"<local-command>ls</local-command>"`),
				},
			},
			wantNil: true,
		},
		{
			name: "command-name prefix skipped",
			rec: Record{
				UUID: "uuid-5",
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"<command-name>git status</command-name>"`),
				},
			},
			wantNil: true,
		},
		{
			name: "tool_result array",
			rec: Record{
				UUID:      "uuid-6",
				Timestamp: ts,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_1","content":"file contents here"}]`),
				},
			},
			wantToolResults: 1,
		},
		{
			name: "tool_result with nested array content",
			rec: Record{
				UUID:      "uuid-7",
				Timestamp: ts,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_2","content":[{"type":"text","text":"nested"}]}]`),
				},
			},
			wantToolResults: 1,
		},
		{
			name: "tool_result with error flag",
			rec: Record{
				UUID:      "uuid-8",
				Timestamp: ts,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_3","content":"error msg","is_error":true}]`),
				},
			},
			wantToolResults: 1,
		},
		{
			name: "tool_result with toolUseResult metadata",
			rec: Record{
				UUID:          "uuid-9",
				Timestamp:     ts,
				ToolUseResult: json.RawMessage(`{"type":"bash","stdout":"hello\n","stderr":""}`),
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_4","content":"hello\n"}]`),
				},
			},
			wantToolResults: 1,
		},
		{
			name: "array with no tool_result blocks returns nil",
			rec: Record{
				UUID: "uuid-10",
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"text","text":"just text"}]`),
				},
			},
			wantNil: true,
		},
		{
			name: "multiple tool_results",
			rec: Record{
				UUID:      "uuid-11",
				Timestamp: ts,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_a","content":"a"},{"type":"tool_result","tool_use_id":"tu_b","content":"b"}]`),
				},
			},
			wantToolResults: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			msg := parseUserRecord(&tt.rec)
			if tt.wantNil {
				if msg != nil {
					t.Fatalf("expected nil, got %+v", msg)
				}
				return
			}
			if msg == nil {
				t.Fatal("expected non-nil message, got nil")
			}
			if msg.Role != "user" {
				t.Errorf("Role = %q, want %q", msg.Role, "user")
			}
			if tt.wantTextContent != "" && msg.TextContent != tt.wantTextContent {
				t.Errorf("TextContent = %q, want %q", msg.TextContent, tt.wantTextContent)
			}
			if tt.wantToolResults > 0 {
				if len(msg.ToolResults) != tt.wantToolResults {
					t.Fatalf("got %d tool results, want %d", len(msg.ToolResults), tt.wantToolResults)
				}
			}
		})
	}

	// Extra check: tool_result with toolUseResult populates Result field
	t.Run("toolUseResult populates Result", func(t *testing.T) {
		rec := Record{
			UUID:          "uuid-meta",
			Timestamp:     ts,
			ToolUseResult: json.RawMessage(`{"type":"bash","stdout":"hello\n","stderr":"warn"}`),
			Message: RawMessage{
				Role:    "user",
				Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_meta","content":"hello\n"}]`),
			},
		}
		msg := parseUserRecord(&rec)
		if msg == nil {
			t.Fatal("expected non-nil")
		}
		if msg.ToolResults[0].Result == nil {
			t.Fatal("expected Result to be populated")
		}
		if msg.ToolResults[0].Result.Type != "bash" {
			t.Errorf("Result.Type = %q, want %q", msg.ToolResults[0].Result.Type, "bash")
		}
		if msg.ToolResults[0].Result.Stdout != "hello\n" {
			t.Errorf("Result.Stdout = %q, want %q", msg.ToolResults[0].Result.Stdout, "hello\n")
		}
		if msg.ToolResults[0].Result.Stderr != "warn" {
			t.Errorf("Result.Stderr = %q, want %q", msg.ToolResults[0].Result.Stderr, "warn")
		}
	})

	// Extra check: tool_result with is_error
	t.Run("tool_result IsError flag preserved", func(t *testing.T) {
		rec := Record{
			UUID:      "uuid-err",
			Timestamp: ts,
			Message: RawMessage{
				Role:    "user",
				Content: json.RawMessage(`[{"type":"tool_result","tool_use_id":"tu_err","content":"boom","is_error":true}]`),
			},
		}
		msg := parseUserRecord(&rec)
		if msg == nil {
			t.Fatal("expected non-nil")
		}
		if !msg.ToolResults[0].IsError {
			t.Error("expected IsError to be true")
		}
		if msg.ToolResults[0].Content != "boom" {
			t.Errorf("Content = %q, want %q", msg.ToolResults[0].Content, "boom")
		}
	})
}

func TestMergeRecords(t *testing.T) {
	ts1 := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	ts2 := time.Date(2024, 1, 15, 10, 1, 0, 0, time.UTC)
	ts3 := time.Date(2024, 1, 15, 10, 2, 0, 0, time.UTC)

	t.Run("empty input", func(t *testing.T) {
		msgs := mergeRecords(nil)
		if len(msgs) != 0 {
			t.Errorf("expected 0 messages, got %d", len(msgs))
		}
	})

	t.Run("single user message", func(t *testing.T) {
		records := []Record{
			{
				UUID:      "u1",
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"Hello"`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 1 {
			t.Fatalf("expected 1 message, got %d", len(msgs))
		}
		if msgs[0].Role != "user" {
			t.Errorf("Role = %q, want %q", msgs[0].Role, "user")
		}
		if msgs[0].TextContent != "Hello" {
			t.Errorf("TextContent = %q, want %q", msgs[0].TextContent, "Hello")
		}
	})

	t.Run("single assistant message", func(t *testing.T) {
		records := []Record{
			{
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_1",
					Content: json.RawMessage(`[{"type":"text","text":"Hi there"}]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 1 {
			t.Fatalf("expected 1 message, got %d", len(msgs))
		}
		if msgs[0].Role != "assistant" {
			t.Errorf("Role = %q, want %q", msgs[0].Role, "assistant")
		}
		if msgs[0].ID != "msg_1" {
			t.Errorf("ID = %q, want %q", msgs[0].ID, "msg_1")
		}
		if len(msgs[0].Blocks) != 1 {
			t.Fatalf("expected 1 block, got %d", len(msgs[0].Blocks))
		}
	})

	t.Run("assistant merge by same message ID", func(t *testing.T) {
		records := []Record{
			{
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_shared",
					Content: json.RawMessage(`[{"type":"text","text":"part 1"}]`),
				},
			},
			{
				Timestamp: ts2,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_shared",
					Content: json.RawMessage(`[{"type":"tool_use","id":"tu_1","name":"Read","input":{}}]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 1 {
			t.Fatalf("expected 1 merged message, got %d", len(msgs))
		}
		if len(msgs[0].Blocks) != 2 {
			t.Fatalf("expected 2 blocks in merged message, got %d", len(msgs[0].Blocks))
		}
		if msgs[0].Blocks[0].Text != "part 1" {
			t.Errorf("block[0].Text = %q, want %q", msgs[0].Blocks[0].Text, "part 1")
		}
		if msgs[0].Blocks[1].Type != "tool_use" {
			t.Errorf("block[1].Type = %q, want %q", msgs[0].Blocks[1].Type, "tool_use")
		}
	})

	t.Run("assistant merge preserves first timestamp", func(t *testing.T) {
		records := []Record{
			{
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_ts",
					Content: json.RawMessage(`[{"type":"text","text":"first"}]`),
				},
			},
			{
				Timestamp: ts2,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_ts",
					Content: json.RawMessage(`[{"type":"text","text":"second"}]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 1 {
			t.Fatalf("expected 1 message, got %d", len(msgs))
		}
		if !msgs[0].Timestamp.Equal(ts1) {
			t.Errorf("Timestamp = %v, want %v (first record)", msgs[0].Timestamp, ts1)
		}
	})

	t.Run("assistant with no ID treated as standalone", func(t *testing.T) {
		records := []Record{
			{
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "",
					Content: json.RawMessage(`[{"type":"text","text":"standalone 1"}]`),
				},
			},
			{
				Timestamp: ts2,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "",
					Content: json.RawMessage(`[{"type":"text","text":"standalone 2"}]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 2 {
			t.Fatalf("expected 2 messages, got %d", len(msgs))
		}
	})

	t.Run("skipped records excluded", func(t *testing.T) {
		records := []Record{
			{
				UUID:      "u1",
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"Hello"`),
				},
			},
			{
				Type:      "file-history-snapshot",
				Timestamp: ts2,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"should be skipped"`),
				},
			},
			{
				Timestamp: ts3,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_a",
					Content: json.RawMessage(`[{"type":"text","text":"response"}]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 2 {
			t.Fatalf("expected 2 messages, got %d", len(msgs))
		}
		if msgs[0].Role != "user" {
			t.Errorf("msgs[0].Role = %q, want %q", msgs[0].Role, "user")
		}
		if msgs[1].Role != "assistant" {
			t.Errorf("msgs[1].Role = %q, want %q", msgs[1].Role, "assistant")
		}
	})

	t.Run("interleaved user and assistant", func(t *testing.T) {
		records := []Record{
			{
				UUID:      "u1",
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"Hi"`),
				},
			},
			{
				Timestamp: ts2,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_1",
					Content: json.RawMessage(`[{"type":"text","text":"Hello!"}]`),
				},
			},
			{
				UUID:      "u2",
				Timestamp: ts3,
				Message: RawMessage{
					Role:    "user",
					Content: json.RawMessage(`"Thanks"`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 3 {
			t.Fatalf("expected 3 messages, got %d", len(msgs))
		}
		if msgs[0].Role != "user" {
			t.Errorf("msgs[0].Role = %q, want %q", msgs[0].Role, "user")
		}
		if msgs[1].Role != "assistant" {
			t.Errorf("msgs[1].Role = %q, want %q", msgs[1].Role, "assistant")
		}
		if msgs[2].Role != "user" {
			t.Errorf("msgs[2].Role = %q, want %q", msgs[2].Role, "user")
		}
	})

	t.Run("assistant with empty blocks is skipped", func(t *testing.T) {
		records := []Record{
			{
				Timestamp: ts1,
				Message: RawMessage{
					Role:    "assistant",
					ID:      "msg_empty",
					Content: json.RawMessage(`[]`),
				},
			},
		}
		msgs := mergeRecords(records)
		if len(msgs) != 0 {
			t.Errorf("expected 0 messages for empty blocks, got %d", len(msgs))
		}
	})
}

func TestParseFile(t *testing.T) {
	t.Run("valid JSONL", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "session.jsonl")
		content := `{"type":"message","uuid":"u1","timestamp":"2024-01-15T10:00:00Z","message":{"role":"user","content":"Hello"}}
{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"assistant","id":"msg_1","content":[{"type":"text","text":"Hi there!"}]}}`
		if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 2 {
			t.Fatalf("expected 2 messages, got %d", len(parsed.Messages))
		}
		if parsed.Messages[0].TextContent != "Hello" {
			t.Errorf("msg[0].TextContent = %q, want %q", parsed.Messages[0].TextContent, "Hello")
		}
		if parsed.Messages[1].Blocks[0].Text != "Hi there!" {
			t.Errorf("msg[1].Blocks[0].Text = %q, want %q", parsed.Messages[1].Blocks[0].Text, "Hi there!")
		}
	})

	t.Run("empty file", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "empty.jsonl")
		if err := os.WriteFile(fp, []byte(""), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 0 {
			t.Errorf("expected 0 messages, got %d", len(parsed.Messages))
		}
	})

	t.Run("blank lines are skipped", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "blanks.jsonl")
		content := `{"type":"message","uuid":"u1","timestamp":"2024-01-15T10:00:00Z","message":{"role":"user","content":"Hello"}}

{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"assistant","id":"msg_1","content":[{"type":"text","text":"Reply"}]}}
`
		if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 2 {
			t.Fatalf("expected 2 messages, got %d", len(parsed.Messages))
		}
	})

	t.Run("malformed line is skipped", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "malformed.jsonl")
		content := `{"type":"message","uuid":"u1","timestamp":"2024-01-15T10:00:00Z","message":{"role":"user","content":"Valid"}}
{this is not valid json}
{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"assistant","id":"msg_1","content":[{"type":"text","text":"Also valid"}]}}`
		if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 2 {
			t.Fatalf("expected 2 messages (malformed skipped), got %d", len(parsed.Messages))
		}
	})

	t.Run("nonexistent file returns error", func(t *testing.T) {
		_, err := ParseFile("/nonexistent/path/file.jsonl")
		if err == nil {
			t.Fatal("expected error for nonexistent file")
		}
	})

	t.Run("records with same message ID merge", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "merge.jsonl")
		content := `{"type":"message","timestamp":"2024-01-15T10:00:00Z","message":{"role":"assistant","id":"msg_shared","content":[{"type":"text","text":"part 1"}]}}
{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"assistant","id":"msg_shared","content":[{"type":"tool_use","id":"tu_1","name":"Bash","input":{"command":"ls"}}]}}`
		if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 1 {
			t.Fatalf("expected 1 merged message, got %d", len(parsed.Messages))
		}
		if len(parsed.Messages[0].Blocks) != 2 {
			t.Fatalf("expected 2 blocks, got %d", len(parsed.Messages[0].Blocks))
		}
	})

	t.Run("meta and progress records are skipped", func(t *testing.T) {
		dir := t.TempDir()
		fp := filepath.Join(dir, "meta.jsonl")
		content := `{"type":"message","uuid":"u1","timestamp":"2024-01-15T10:00:00Z","message":{"role":"user","content":"Hello"}}
{"type":"progress","timestamp":"2024-01-15T10:00:01Z","message":{"role":"assistant","content":[{"type":"text","text":"thinking..."}]}}
{"type":"message","isMeta":true,"timestamp":"2024-01-15T10:00:02Z","message":{"role":"user","content":"meta stuff"}}
{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"assistant","id":"msg_1","content":[{"type":"text","text":"Response"}]}}`
		if err := os.WriteFile(fp, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		parsed, err := ParseFile(fp)
		if err != nil {
			t.Fatal(err)
		}
		if len(parsed.Messages) != 2 {
			t.Fatalf("expected 2 messages (progress and meta skipped), got %d", len(parsed.Messages))
		}
	})
}
