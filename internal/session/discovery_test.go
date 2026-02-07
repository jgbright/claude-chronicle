package session

import (
	"os"
	"path/filepath"
	"runtime"
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

	// Write session files
	if err := os.WriteFile(filepath.Join(proj1, "abc-123.jsonl"), []byte(`{}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(proj1, "def-456.jsonl"), []byte(`{}`), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(proj2, "ghi-789.jsonl"), []byte(`{}`), 0644); err != nil {
		t.Fatal(err)
	}
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

	// Check session abc-123
	s, ok := byID["abc-123"]
	if !ok {
		t.Fatal("expected to find session abc-123")
	}
	if s.ProjectDir != "D--repos-myproject" {
		t.Errorf("ProjectDir = %q, want %q", s.ProjectDir, "D--repos-myproject")
	}
	if s.ProjectName != "D:/repos/myproject" {
		t.Errorf("ProjectName = %q, want %q", s.ProjectName, "D:/repos/myproject")
	}

	// Check session ghi-789
	s2, ok := byID["ghi-789"]
	if !ok {
		t.Fatal("expected to find session ghi-789")
	}
	if s2.ProjectDir != "C--work-app" {
		t.Errorf("ProjectDir = %q, want %q", s2.ProjectDir, "C--work-app")
	}
}

func TestDiscoverSessionsNoProjectsDir(t *testing.T) {
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}
	// No .claude/projects directory — should return error
	_, err := DiscoverSessions()
	if err == nil {
		t.Fatal("expected error when projects dir doesn't exist")
	}
}

func TestFindSession(t *testing.T) {
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}

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
