package session

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestDecodeProjectName(t *testing.T) {
	tests := []struct {
		name    string
		encoded string
		want    string
	}{
		{
			name:    "Windows drive path",
			encoded: "D--repos-claude-chronicle",
			want:    "D:/repos/claude/chronicle",
		},
		{
			name:    "Windows drive path single segment",
			encoded: "C--projects",
			want:    "C:/projects",
		},
		{
			name:    "Unix path (no drive letter pattern)",
			encoded: "home-user-projects-myapp",
			want:    "home/user/projects/myapp",
		},
		{
			name:    "Short name",
			encoded: "abc",
			want:    "abc",
		},
		{
			name:    "Single char",
			encoded: "a",
			want:    "a",
		},
		{
			name:    "Two chars",
			encoded: "ab",
			want:    "ab",
		},
		{
			name:    "Windows drive with deep path",
			encoded: "E--work-repos-org-project-name",
			want:    "E:/work/repos/org/project/name",
		},
		{
			name:    "Empty string",
			encoded: "",
			want:    "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := decodeProjectName(tt.encoded)
			if got != tt.want {
				t.Errorf("decodeProjectName(%q) = %q, want %q", tt.encoded, got, tt.want)
			}
		})
	}
}

func TestDiscoverSessions(t *testing.T) {
	// Create a fake home directory structure
	tmpDir := t.TempDir()

	// Set the correct env var based on OS
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}
	t.Setenv("CHRONICLE_DATA_DIR", "")
	InvalidateDiscoveryCache()

	projectsDir := filepath.Join(tmpDir, ".claude", "projects")

	// Create project directories with JSONL files
	proj1 := filepath.Join(projectsDir, "D--repos-myproject")
	proj2 := filepath.Join(projectsDir, "C--work-app")
	if err := os.MkdirAll(proj1, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(proj2, 0755); err != nil {
		t.Fatal(err)
	}

	// Write session files with cwd and user messages
	writeJSONL := func(path string, lines ...string) {
		t.Helper()
		var content string
		for _, l := range lines {
			content += l + "\n"
		}
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}

	writeJSONL(filepath.Join(proj1, "abc-123.jsonl"),
		`{"type":"user","cwd":"D:\\repos\\myproject","message":{"role":"user","content":"Help me fix the build"}}`,
		`{"type":"assistant","cwd":"D:\\repos\\myproject","message":{"role":"assistant","content":[{"type":"text","text":"Sure!"}]}}`,
	)
	writeJSONL(filepath.Join(proj1, "def-456.jsonl"),
		`{"type":"user","cwd":"D:\\repos\\myproject","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"ok"}]}}`,
		`{"type":"user","cwd":"D:\\repos\\myproject","message":{"role":"user","content":"Add tests for parser"}}`,
	)
	writeJSONL(filepath.Join(proj2, "ghi-789.jsonl"),
		`{"type":"user","cwd":"C:\\work\\app","message":{"role":"user","content":"Deploy the service"}}`,
	)
	// Non-JSONL file should be ignored
	if err := os.WriteFile(filepath.Join(proj1, "readme.txt"), []byte("ignore"), 0644); err != nil {
		t.Fatal(err)
	}
	// Nested directory should be ignored
	nestedDir := filepath.Join(proj1, "subdir")
	if err := os.MkdirAll(nestedDir, 0755); err != nil {
		t.Fatal(err)
	}

	sessions, err := DiscoverSessions()
	if err != nil {
		t.Fatal(err)
	}

	if len(sessions) != 3 {
		t.Fatalf("expected 3 sessions, got %d", len(sessions))
	}

	// Build a map for easy lookup
	byID := make(map[string]SessionInfo)
	for _, s := range sessions {
		byID[s.ID] = s
	}

	// Check session abc-123: cwd overrides decodeProjectName
	s, ok := byID["abc-123"]
	if !ok {
		t.Fatal("expected to find session abc-123")
	}
	if s.ProjectDir != "D--repos-myproject" {
		t.Errorf("ProjectDir = %q, want %q", s.ProjectDir, "D--repos-myproject")
	}
	if s.ProjectName != `D:\repos\myproject` {
		t.Errorf("ProjectName = %q, want %q", s.ProjectName, `D:\repos\myproject`)
	}
	if s.Title != "Help me fix the build" {
		t.Errorf("Title = %q, want %q", s.Title, "Help me fix the build")
	}

	// Check session def-456: first user message is a tool_result, title comes from second message
	s3, ok := byID["def-456"]
	if !ok {
		t.Fatal("expected to find session def-456")
	}
	if s3.Title != "Add tests for parser" {
		t.Errorf("Title = %q, want %q", s3.Title, "Add tests for parser")
	}

	// Check session ghi-789
	s2, ok := byID["ghi-789"]
	if !ok {
		t.Fatal("expected to find session ghi-789")
	}
	if s2.ProjectDir != "C--work-app" {
		t.Errorf("ProjectDir = %q, want %q", s2.ProjectDir, "C--work-app")
	}
	if s2.ProjectName != `C:\work\app` {
		t.Errorf("ProjectName = %q, want %q", s2.ProjectName, `C:\work\app`)
	}
	if s2.Title != "Deploy the service" {
		t.Errorf("Title = %q, want %q", s2.Title, "Deploy the service")
	}
}

func TestDiscoverSessionsNoProjectsDir(t *testing.T) {
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}
	t.Setenv("CHRONICLE_DATA_DIR", "")
	InvalidateDiscoveryCache()
	// No .claude/projects directory — should return error
	_, err := DiscoverSessions()
	if err == nil {
		t.Fatal("expected error when projects dir doesn't exist")
	}
}

func TestScanSessionMetadata(t *testing.T) {
	t.Run("extracts cwd and title from user message with string content", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "test.jsonl")
		os.WriteFile(path, []byte(
			`{"type":"user","cwd":"/home/user/project","message":{"role":"user","content":"Fix the login bug"}}`+"\n"+
				`{"type":"assistant","cwd":"/home/user/project","message":{"role":"assistant","content":[{"type":"text","text":"On it!"}]}}`+"\n",
		), 0644)

		meta := scanSessionMetadata(path)
		if meta.CWD != "/home/user/project" {
			t.Errorf("CWD = %q, want %q", meta.CWD, "/home/user/project")
		}
		if meta.Title != "Fix the login bug" {
			t.Errorf("Title = %q, want %q", meta.Title, "Fix the login bug")
		}
	})

	t.Run("extracts title from content block array", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "test.jsonl")
		os.WriteFile(path, []byte(
			`{"type":"user","cwd":"/tmp","message":{"role":"user","content":[{"type":"text","text":"Add new feature"}]}}`+"\n",
		), 0644)

		meta := scanSessionMetadata(path)
		if meta.Title != "Add new feature" {
			t.Errorf("Title = %q, want %q", meta.Title, "Add new feature")
		}
	})

	t.Run("skips tool_result only messages for title", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "test.jsonl")
		os.WriteFile(path, []byte(
			`{"type":"user","cwd":"/tmp","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"output"}]}}`+"\n"+
				`{"type":"user","cwd":"/tmp","message":{"role":"user","content":"Real question here"}}`+"\n",
		), 0644)

		meta := scanSessionMetadata(path)
		if meta.Title != "Real question here" {
			t.Errorf("Title = %q, want %q", meta.Title, "Real question here")
		}
	})

	t.Run("skips non-message records", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "test.jsonl")
		os.WriteFile(path, []byte(
			`{"type":"file-history-snapshot","messageId":"abc"}`+"\n"+
				`{"type":"user","cwd":"D:\\repos\\test","message":{"role":"user","content":"Hello world"}}`+"\n",
		), 0644)

		meta := scanSessionMetadata(path)
		if meta.CWD != `D:\repos\test` {
			t.Errorf("CWD = %q, want %q", meta.CWD, `D:\repos\test`)
		}
		if meta.Title != "Hello world" {
			t.Errorf("Title = %q, want %q", meta.Title, "Hello world")
		}
	})

	t.Run("handles nonexistent file gracefully", func(t *testing.T) {
		meta := scanSessionMetadata("/nonexistent/path.jsonl")
		if meta.CWD != "" || meta.Title != "" {
			t.Errorf("expected empty metadata, got CWD=%q Title=%q", meta.CWD, meta.Title)
		}
	})

	t.Run("handles empty file", func(t *testing.T) {
		tmpDir := t.TempDir()
		path := filepath.Join(tmpDir, "empty.jsonl")
		os.WriteFile(path, []byte{}, 0644)

		meta := scanSessionMetadata(path)
		if meta.CWD != "" || meta.Title != "" {
			t.Errorf("expected empty metadata, got CWD=%q Title=%q", meta.CWD, meta.Title)
		}
	})
}

func TestTruncateTitle(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{"short string", "Hello", "Hello"},
		{"multiline takes first line", "First line\nSecond line\nThird", "First line"},
		{"trims whitespace", "  Hello  \n  World", "Hello"},
		{"caps at 100 chars", fmt.Sprintf("%s extra", strings.Repeat("a", 100)), strings.Repeat("a", 97) + "..."},
		{"empty string", "", ""},
		{"handles \\r\\n", "Line one\r\nLine two", "Line one"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := truncateTitle(tt.input)
			if got != tt.want {
				t.Errorf("truncateTitle(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestFindSession(t *testing.T) {
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}
	t.Setenv("CHRONICLE_DATA_DIR", "")
	InvalidateDiscoveryCache()

	projDir := filepath.Join(tmpDir, ".claude", "projects", "D--repos-test")
	if err := os.MkdirAll(projDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(projDir, "target-session.jsonl"), []byte(`{}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(projDir, "other-session.jsonl"), []byte(`{}`), 0644); err != nil {
		t.Fatal(err)
	}

	t.Run("found", func(t *testing.T) {
		info, err := FindSession("target-session")
		if err != nil {
			t.Fatal(err)
		}
		if info == nil {
			t.Fatal("expected to find session")
		}
		if info.ID != "target-session" {
			t.Errorf("ID = %q, want %q", info.ID, "target-session")
		}
	})

	t.Run("not found", func(t *testing.T) {
		info, err := FindSession("nonexistent-id")
		if err != nil {
			t.Fatal(err)
		}
		if info != nil {
			t.Errorf("expected nil, got %+v", info)
		}
	})
}
