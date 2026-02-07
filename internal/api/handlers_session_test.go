package api

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"testing/fstest"
	"time"

	"github.com/jgbright/claude-chronicle/internal/session"
)

// setupHandlerTest creates a temp dir and redirects HOME/USERPROFILE to it.
// Returns the temp dir path.
func setupHandlerTest(t *testing.T) string {
	t.Helper()
	tmpDir := t.TempDir()
	if runtime.GOOS == "windows" {
		t.Setenv("USERPROFILE", tmpDir)
	} else {
		t.Setenv("HOME", tmpDir)
	}
	return tmpDir
}

// newTestServer creates a Server with a dummy webFS for handler testing.
func newTestServer() *Server {
	webFS := fstest.MapFS{
		"index.html": {Data: []byte("<html>test</html>")},
	}
	return NewServer(webFS, false, "")
}

// minimalJSONL is a valid two-line JSONL session file.
const minimalJSONL = `{"type":"human","uuid":"u1","message":{"role":"user","content":"hello"},"timestamp":"2025-01-15T10:00:00Z"}
{"type":"assistant","uuid":"a1","message":{"role":"assistant","id":"msg1","content":[{"type":"text","text":"hi"}]},"timestamp":"2025-01-15T10:01:00Z"}
`

// createSessionFile writes a JSONL file into the expected directory structure.
// Returns the project directory name used.
func createSessionFile(t *testing.T, tmpDir, projName, sessionID, content string) string {
	t.Helper()
	projDir := filepath.Join(tmpDir, ".claude", "projects", projName)
	if err := os.MkdirAll(projDir, 0755); err != nil {
		t.Fatal(err)
	}
	filePath := filepath.Join(projDir, sessionID+".jsonl")
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	return projName
}

func TestHandleListSessions(t *testing.T) {
	t.Run("empty directory returns empty array", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		// Create the projects dir but leave it empty
		projectsDir := filepath.Join(tmpDir, ".claude", "projects")
		if err := os.MkdirAll(projectsDir, 0755); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		ct := resp.Header.Get("Content-Type")
		if ct != "application/json" {
			t.Errorf("Content-Type = %q, want application/json", ct)
		}

		var sessions []session.SessionInfo
		if err := json.Unmarshal(body, &sessions); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}
		if len(sessions) != 0 {
			t.Errorf("expected 0 sessions, got %d", len(sessions))
		}
	})

	t.Run("single session is returned", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "test-project", "session-aaa", minimalJSONL)

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var sessions []session.SessionInfo
		if err := json.Unmarshal(body, &sessions); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if len(sessions) != 1 {
			t.Fatalf("expected 1 session, got %d", len(sessions))
		}
		if sessions[0].ID != "session-aaa" {
			t.Errorf("session ID = %q, want %q", sessions[0].ID, "session-aaa")
		}
	})

	t.Run("multiple sessions sorted by ModTime descending", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		// Create two sessions — write the "older" one first so its ModTime is earlier
		createSessionFile(t, tmpDir, "proj1", "session-old", minimalJSONL)

		// Small sleep to ensure different ModTime values
		time.Sleep(50 * time.Millisecond)

		createSessionFile(t, tmpDir, "proj1", "session-new", minimalJSONL)

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}

		var sessions []session.SessionInfo
		if err := json.Unmarshal(body, &sessions); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if len(sessions) != 2 {
			t.Fatalf("expected 2 sessions, got %d", len(sessions))
		}

		// Newest should be first
		if !sessions[0].ModTime.After(sessions[1].ModTime) {
			t.Errorf("sessions not sorted by ModTime desc: first=%v, second=%v",
				sessions[0].ModTime, sessions[1].ModTime)
		}
	})
}

func TestHandleListSessionsDiscoveryError(t *testing.T) {
	// When .claude/projects doesn't exist, DiscoverSessions returns an error
	// and the handler returns 500.
	tmpDir := setupHandlerTest(t)
	// Don't create the projects dir — just the .claude dir so the path is wrong
	_ = tmpDir

	s := newTestServer()
	req := httptest.NewRequest("GET", "/api/sessions", nil)
	w := httptest.NewRecorder()
	s.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, body)
	}
}

func TestHandleGetSession(t *testing.T) {
	t.Run("valid ID returns parsed session", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "test-project", "abc-123-def", minimalJSONL)

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/abc-123-def", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var parsed session.ParsedSession
		if err := json.Unmarshal(body, &parsed); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if parsed.Info.ID != "abc-123-def" {
			t.Errorf("session ID = %q, want %q", parsed.Info.ID, "abc-123-def")
		}
		if len(parsed.Messages) == 0 {
			t.Error("expected at least one message in parsed session")
		}
	})

	t.Run("discovery error returns 500", func(t *testing.T) {
		setupHandlerTest(t)
		// Don't create projects dir — FindSession calls DiscoverSessions which will fail

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/some-id", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, body)
		}
	})

	t.Run("missing ID returns 404", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		// Create the projects dir so DiscoverSessions doesn't fail
		projectsDir := filepath.Join(tmpDir, ".claude", "projects")
		if err := os.MkdirAll(projectsDir, 0755); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/nonexistent-id", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNotFound {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusNotFound, body)
		}
	})
}
