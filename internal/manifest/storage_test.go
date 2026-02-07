package manifest

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestSaveAndLoad(t *testing.T) {
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}

	t.Run("round trip save and load", func(t *testing.T) {
		m := &Manifest{
			Version:   1,
			SessionID: "test-session-1",
			Edits: []Edit{
				{Type: "delete", BlockID: "block-1"},
				{Type: "annotate", AfterBlockID: "block-2", ID: "annot-1", Content: "A note"},
			},
		}

		if err := Save(m); err != nil {
			t.Fatal(err)
		}

		loaded, err := Load("test-session-1")
		if err != nil {
			t.Fatal(err)
		}
		if loaded == nil {
			t.Fatal("expected non-nil manifest")
		}
		if loaded.Version != 1 {
			t.Errorf("Version = %d, want 1", loaded.Version)
		}
		if loaded.SessionID != "test-session-1" {
			t.Errorf("SessionID = %q, want %q", loaded.SessionID, "test-session-1")
		}
		if len(loaded.Edits) != 2 {
			t.Fatalf("got %d edits, want 2", len(loaded.Edits))
		}
		if loaded.Edits[0].Type != "delete" {
			t.Errorf("Edits[0].Type = %q, want %q", loaded.Edits[0].Type, "delete")
		}
		if loaded.Edits[0].BlockID != "block-1" {
			t.Errorf("Edits[0].BlockID = %q, want %q", loaded.Edits[0].BlockID, "block-1")
		}
		if loaded.Edits[1].Type != "annotate" {
			t.Errorf("Edits[1].Type = %q, want %q", loaded.Edits[1].Type, "annotate")
		}
		if loaded.Edits[1].Content != "A note" {
			t.Errorf("Edits[1].Content = %q, want %q", loaded.Edits[1].Content, "A note")
		}
	})

	t.Run("load nonexistent returns nil", func(t *testing.T) {
		loaded, err := Load("does-not-exist")
		if err != nil {
			t.Fatal(err)
		}
		if loaded != nil {
			t.Errorf("expected nil for nonexistent manifest, got %+v", loaded)
		}
	})

	t.Run("save creates directory", func(t *testing.T) {
		// Use a fresh temp dir to ensure manifest dir doesn't exist yet
		freshDir := t.TempDir()
		if runtime.GOOS == "windows" {
			t.Setenv("USERPROFILE", freshDir)
		} else {
			t.Setenv("HOME", freshDir)
		}

		m := &Manifest{
			Version:   1,
			SessionID: "new-session",
			Edits:     []Edit{},
		}

		if err := Save(m); err != nil {
			t.Fatal(err)
		}

		// Verify the manifest directory was created
		dir := filepath.Join(freshDir, ".claude-chronicle", "manifests")
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			t.Error("expected manifest directory to be created")
		}
	})

	t.Run("overwrite existing manifest", func(t *testing.T) {
		m1 := &Manifest{
			Version:   1,
			SessionID: "overwrite-test",
			Edits: []Edit{
				{Type: "delete", BlockID: "old-block"},
			},
		}
		if err := Save(m1); err != nil {
			t.Fatal(err)
		}

		m2 := &Manifest{
			Version:   1,
			SessionID: "overwrite-test",
			Edits: []Edit{
				{Type: "annotate", AfterBlockID: "new-block", ID: "a1", Content: "Updated"},
			},
		}
		if err := Save(m2); err != nil {
			t.Fatal(err)
		}

		loaded, err := Load("overwrite-test")
		if err != nil {
			t.Fatal(err)
		}
		if loaded == nil {
			t.Fatal("expected non-nil manifest")
		}
		if len(loaded.Edits) != 1 {
			t.Fatalf("got %d edits, want 1", len(loaded.Edits))
		}
		if loaded.Edits[0].Type != "annotate" {
			t.Errorf("Edits[0].Type = %q, want %q", loaded.Edits[0].Type, "annotate")
		}
		if loaded.Edits[0].Content != "Updated" {
			t.Errorf("Edits[0].Content = %q, want %q", loaded.Edits[0].Content, "Updated")
		}
	})

	t.Run("save and load collapse edit with blockIDs", func(t *testing.T) {
		m := &Manifest{
			Version:   1,
			SessionID: "collapse-test",
			Edits: []Edit{
				{Type: "collapse", BlockIDs: []string{"b1", "b2", "b3"}, Summary: "Grouped"},
			},
		}
		if err := Save(m); err != nil {
			t.Fatal(err)
		}

		loaded, err := Load("collapse-test")
		if err != nil {
			t.Fatal(err)
		}
		if loaded == nil {
			t.Fatal("expected non-nil")
		}
		if len(loaded.Edits[0].BlockIDs) != 3 {
			t.Errorf("expected 3 blockIDs, got %d", len(loaded.Edits[0].BlockIDs))
		}
		if loaded.Edits[0].Summary != "Grouped" {
			t.Errorf("Summary = %q, want %q", loaded.Edits[0].Summary, "Grouped")
		}
	})
}
