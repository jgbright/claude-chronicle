package watcher

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestNew_WatchesProjectsDir(t *testing.T) {
	dir := t.TempDir()
	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}
	defer w.Close()
}

func TestSessionUpdated_OnJSONLWrite(t *testing.T) {
	dir := t.TempDir()

	// Create a project subdir with a .jsonl file
	projDir := filepath.Join(dir, "test-project")
	os.Mkdir(projDir, 0o755)
	jsonlPath := filepath.Join(projDir, "abc123.jsonl")
	os.WriteFile(jsonlPath, []byte(`{"type":"user"}`+"\n"), 0o644)

	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}
	defer w.Close()

	// Modify the file
	time.Sleep(50 * time.Millisecond) // let watcher start
	f, _ := os.OpenFile(jsonlPath, os.O_APPEND|os.O_WRONLY, 0o644)
	f.WriteString(`{"type":"assistant"}` + "\n")
	f.Close()

	ev := waitForEvent(t, w.Events(), 2*time.Second)
	if ev.Type != SessionUpdated {
		t.Errorf("expected SessionUpdated, got %s", ev.Type)
	}
	if ev.SessionID != "abc123" {
		t.Errorf("expected session ID abc123, got %s", ev.SessionID)
	}
}

func TestSessionsChanged_OnNewJSONL(t *testing.T) {
	dir := t.TempDir()

	projDir := filepath.Join(dir, "test-project")
	os.Mkdir(projDir, 0o755)

	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}
	defer w.Close()

	// Create a new .jsonl file
	time.Sleep(50 * time.Millisecond)
	os.WriteFile(filepath.Join(projDir, "new-session.jsonl"), []byte(`{}`+"\n"), 0o644)

	ev := waitForEvent(t, w.Events(), 2*time.Second)
	if ev.Type != SessionsChanged {
		t.Errorf("expected SessionsChanged, got %s", ev.Type)
	}
}

func TestAutoWatchNewProjectDir(t *testing.T) {
	dir := t.TempDir()

	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}
	defer w.Close()

	// Create a new project directory
	time.Sleep(50 * time.Millisecond)
	newProjDir := filepath.Join(dir, "new-project")
	os.Mkdir(newProjDir, 0o755)

	// Should get sessions_changed for the new directory
	ev := waitForEvent(t, w.Events(), 2*time.Second)
	if ev.Type != SessionsChanged {
		t.Errorf("expected SessionsChanged for new dir, got %s", ev.Type)
	}

	// Now create a file in the new project dir — should be detected
	time.Sleep(100 * time.Millisecond) // give auto-watch time
	os.WriteFile(filepath.Join(newProjDir, "sess.jsonl"), []byte(`{}`+"\n"), 0o644)

	ev = waitForEvent(t, w.Events(), 2*time.Second)
	if ev.Type != SessionsChanged {
		t.Errorf("expected SessionsChanged for new file in auto-watched dir, got %s", ev.Type)
	}
}

func TestDebounce_BatchesRapidWrites(t *testing.T) {
	dir := t.TempDir()

	projDir := filepath.Join(dir, "test-project")
	os.Mkdir(projDir, 0o755)
	jsonlPath := filepath.Join(projDir, "rapid.jsonl")
	os.WriteFile(jsonlPath, []byte(`{}`+"\n"), 0o644)

	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}
	defer w.Close()

	time.Sleep(50 * time.Millisecond)

	// Write rapidly multiple times
	for i := 0; i < 5; i++ {
		f, _ := os.OpenFile(jsonlPath, os.O_APPEND|os.O_WRONLY, 0o644)
		f.WriteString(`{"i":` + string(rune('0'+i)) + "}\n")
		f.Close()
		time.Sleep(10 * time.Millisecond)
	}

	// Should get exactly one event after debounce
	ev := waitForEvent(t, w.Events(), 2*time.Second)
	if ev.Type != SessionUpdated {
		t.Errorf("expected SessionUpdated, got %s", ev.Type)
	}

	// No more events within the debounce window
	select {
	case extra := <-w.Events():
		t.Errorf("unexpected extra event: %+v", extra)
	case <-time.After(700 * time.Millisecond):
		// good — no extra events
	}
}

func TestClose_StopsCleanly(t *testing.T) {
	dir := t.TempDir()
	w, err := New(dir)
	if err != nil {
		t.Fatalf("New() error: %v", err)
	}

	err = w.Close()
	if err != nil {
		t.Errorf("Close() error: %v", err)
	}

	// Events channel should be closed
	_, ok := <-w.Events()
	if ok {
		t.Error("expected events channel to be closed after Close()")
	}
}

func waitForEvent(t *testing.T, ch <-chan Event, timeout time.Duration) Event {
	t.Helper()
	select {
	case ev, ok := <-ch:
		if !ok {
			t.Fatal("events channel closed unexpectedly")
		}
		return ev
	case <-time.After(timeout):
		t.Fatal("timed out waiting for event")
		return Event{} // unreachable
	}
}
