package api

import (
	"encoding/json"
	"fmt"
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
	t.Setenv("CHRONICLE_DATA_DIR", "")
	session.InvalidateDiscoveryCache()
	return tmpDir
}

// newTestServer creates a Server with a dummy webFS for handler testing.
func newTestServer() *Server {
	webFS := fstest.MapFS{
		"index.html": {Data: []byte("<html>test</html>")},
	}
	return NewServer(webFS, false, "", BuildInfo{})
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

func TestHandleListSessionsDeleted(t *testing.T) {
	// Helper to mark a session as deleted via manifest.
	markDeleted := func(t *testing.T, tmpDir, sessionID string) {
		t.Helper()
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		data := fmt.Sprintf(`{"version":1,"sessionId":%q,"metadata":{"deleted":true},"edits":[]}`, sessionID)
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), []byte(data), 0644); err != nil {
			t.Fatal(err)
		}
	}

	t.Run("deleted sessions excluded by default", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "visible", minimalJSONL)
		createSessionFile(t, tmpDir, "proj1", "hidden", minimalJSONL)
		markDeleted(t, tmpDir, "hidden")

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
		if sessions[0].ID != "visible" {
			t.Errorf("session ID = %q, want %q", sessions[0].ID, "visible")
		}
	})

	t.Run("deleted sessions included with ?deleted=true", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "visible", minimalJSONL)
		createSessionFile(t, tmpDir, "proj1", "hidden", minimalJSONL)
		markDeleted(t, tmpDir, "hidden")

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions?deleted=true", nil)
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
		if len(sessions) != 2 {
			t.Fatalf("expected 2 sessions, got %d", len(sessions))
		}

		// Find the deleted session and verify its Deleted flag
		foundDeleted := false
		for _, s := range sessions {
			if s.ID == "hidden" {
				foundDeleted = true
				if !s.Deleted {
					t.Error("expected hidden session to have Deleted=true")
				}
			}
		}
		if !foundDeleted {
			t.Error("hidden session not found in response")
		}
	})
}

func TestHandleListSessionsFilters(t *testing.T) {
	// JSONL with different content for search testing
	jsonlWithContent := func(userMsg, assistantMsg string) string {
		return fmt.Sprintf(`{"type":"human","uuid":"u1","message":{"role":"user","content":%q},"timestamp":"2025-01-15T10:00:00Z"}
{"type":"assistant","uuid":"a1","message":{"role":"assistant","id":"msg1","content":[{"type":"text","text":%q}]},"timestamp":"2025-01-15T10:01:00Z"}
`, userMsg, assistantMsg)
	}

	t.Run("project filter returns only matching project", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "s1", minimalJSONL)
		createSessionFile(t, tmpDir, "proj2", "s2", minimalJSONL)

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions?project=proj1", nil)
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
		if sessions[0].ID != "s1" {
			t.Errorf("session ID = %q, want %q", sessions[0].ID, "s1")
		}
	})

	t.Run("search filter matches content", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "s1", jsonlWithContent("fix the login bug", "sure"))
		createSessionFile(t, tmpDir, "proj1", "s2", jsonlWithContent("add dark mode", "ok"))

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions?q=login", nil)
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
		if sessions[0].ID != "s1" {
			t.Errorf("session ID = %q, want %q", sessions[0].ID, "s1")
		}
	})

	t.Run("combined project and search filters (AND)", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "s1", jsonlWithContent("fix login bug", "done"))
		createSessionFile(t, tmpDir, "proj2", "s2", jsonlWithContent("fix login issue", "done"))
		createSessionFile(t, tmpDir, "proj1", "s3", jsonlWithContent("add feature", "ok"))

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions?q=login&project=proj1", nil)
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
		if sessions[0].ID != "s1" {
			t.Errorf("session ID = %q, want %q", sessions[0].ID, "s1")
		}
	})

	t.Run("search with no matches returns empty array", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		createSessionFile(t, tmpDir, "proj1", "s1", minimalJSONL)

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions?q=nonexistent", nil)
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
		if len(sessions) != 0 {
			t.Errorf("expected 0 sessions, got %d", len(sessions))
		}
	})
}

func TestHandleListSessionsCacheCorruption(t *testing.T) {
	// Bug: handleListSessions uses `filtered := sessions[:0]` which shares
	// the backing array with the discovery cache. When filtering skips sessions
	// (e.g., deleted ones), append overwrites cached entries, corrupting data
	// for subsequent requests. It also mutates cached Title/Deleted fields
	// directly, so manifest overrides bleed across requests.
	//
	// Repro: create 3 sessions (A, B, C), soft-delete B. Two back-to-back
	// requests (within cache TTL) should both return A and C with correct IDs
	// and correct manifest titles.

	markDeleted := func(t *testing.T, tmpDir, sessionID string) {
		t.Helper()
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		data := fmt.Sprintf(`{"version":1,"sessionId":%q,"metadata":{"deleted":true},"edits":[]}`, sessionID)
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), []byte(data), 0644); err != nil {
			t.Fatal(err)
		}
	}

	setManifestTitle := func(t *testing.T, tmpDir, sessionID, title string) {
		t.Helper()
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		data := fmt.Sprintf(`{"version":1,"sessionId":%q,"metadata":{"title":%q},"edits":[]}`, sessionID, title)
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), []byte(data), 0644); err != nil {
			t.Fatal(err)
		}
	}

	t.Run("filtered request does not corrupt cache for next request", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		// Create 3 sessions in a single project.
		// Use sleep to get deterministic sort order (newest first).
		createSessionFile(t, tmpDir, "proj1", "session-a", minimalJSONL)
		time.Sleep(50 * time.Millisecond)
		createSessionFile(t, tmpDir, "proj1", "session-b", minimalJSONL)
		time.Sleep(50 * time.Millisecond)
		createSessionFile(t, tmpDir, "proj1", "session-c", minimalJSONL)

		// Soft-delete session B
		markDeleted(t, tmpDir, "session-b")

		// Set a custom title on session A via manifest
		setManifestTitle(t, tmpDir, "session-a", "Custom Title A")

		s := newTestServer()

		// First request (default, no deleted=true) — this populates the cache
		// and filters out session-b. The filtering step should NOT corrupt the cache.
		req1 := httptest.NewRequest("GET", "/api/sessions", nil)
		w1 := httptest.NewRecorder()
		s.ServeHTTP(w1, req1)

		var list1 []session.SessionInfo
		if err := json.Unmarshal(w1.Body.Bytes(), &list1); err != nil {
			t.Fatalf("failed to unmarshal first response: %v", err)
		}
		if len(list1) != 2 {
			t.Fatalf("first request: expected 2 sessions, got %d", len(list1))
		}

		// Second request (within cache TTL) — should return the same correct data
		req2 := httptest.NewRequest("GET", "/api/sessions", nil)
		w2 := httptest.NewRecorder()
		s.ServeHTTP(w2, req2)

		var list2 []session.SessionInfo
		if err := json.Unmarshal(w2.Body.Bytes(), &list2); err != nil {
			t.Fatalf("failed to unmarshal second response: %v", err)
		}
		if len(list2) != 2 {
			t.Fatalf("second request: expected 2 sessions, got %d", len(list2))
		}

		// Verify both requests return the same session IDs
		ids1 := map[string]bool{}
		for _, s := range list1 {
			ids1[s.ID] = true
		}
		ids2 := map[string]bool{}
		for _, s := range list2 {
			ids2[s.ID] = true
		}

		for id := range ids1 {
			if !ids2[id] {
				t.Errorf("session %q in first response but missing from second", id)
			}
		}
		for id := range ids2 {
			if !ids1[id] {
				t.Errorf("session %q in second response but missing from first", id)
			}
		}

		// Verify both requests return correct IDs (a and c, not b)
		for _, list := range [][]session.SessionInfo{list1, list2} {
			for _, s := range list {
				if s.ID == "session-b" {
					t.Errorf("deleted session-b should not appear in unfiltered response")
				}
				if s.ID != "session-a" && s.ID != "session-c" {
					t.Errorf("unexpected session ID: %q", s.ID)
				}
			}
		}
	})

	t.Run("manifest title survives across cached requests", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		createSessionFile(t, tmpDir, "proj1", "session-x", minimalJSONL)
		time.Sleep(50 * time.Millisecond)
		createSessionFile(t, tmpDir, "proj1", "session-y", minimalJSONL)

		setManifestTitle(t, tmpDir, "session-x", "My Custom Title")

		s := newTestServer()

		// First request populates cache and applies manifest title
		req1 := httptest.NewRequest("GET", "/api/sessions", nil)
		w1 := httptest.NewRecorder()
		s.ServeHTTP(w1, req1)

		var list1 []session.SessionInfo
		if err := json.Unmarshal(w1.Body.Bytes(), &list1); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		// Verify title in first response
		var foundTitle1 string
		for _, s := range list1 {
			if s.ID == "session-x" {
				foundTitle1 = s.Title
			}
		}
		if foundTitle1 != "My Custom Title" {
			t.Errorf("first request: session-x title = %q, want %q", foundTitle1, "My Custom Title")
		}

		// Now update the manifest title
		setManifestTitle(t, tmpDir, "session-x", "Updated Title")

		// Second request (within cache TTL) — the title should reflect the
		// updated manifest, not be stale from the first request's mutation.
		req2 := httptest.NewRequest("GET", "/api/sessions", nil)
		w2 := httptest.NewRecorder()
		s.ServeHTTP(w2, req2)

		var list2 []session.SessionInfo
		if err := json.Unmarshal(w2.Body.Bytes(), &list2); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		var foundTitle2 string
		for _, s := range list2 {
			if s.ID == "session-x" {
				foundTitle2 = s.Title
			}
		}
		if foundTitle2 != "Updated Title" {
			t.Errorf("second request: session-x title = %q, want %q", foundTitle2, "Updated Title")
		}
	})

	t.Run("deleted flag does not bleed from cached mutation", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		createSessionFile(t, tmpDir, "proj1", "session-p", minimalJSONL)
		time.Sleep(50 * time.Millisecond)
		createSessionFile(t, tmpDir, "proj1", "session-q", minimalJSONL)

		// Mark session-q as deleted
		markDeleted(t, tmpDir, "session-q")

		s := newTestServer()

		// First request with ?deleted=true — applies Deleted=true to session-q in cache
		req1 := httptest.NewRequest("GET", "/api/sessions?deleted=true", nil)
		w1 := httptest.NewRecorder()
		s.ServeHTTP(w1, req1)

		var list1 []session.SessionInfo
		if err := json.Unmarshal(w1.Body.Bytes(), &list1); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if len(list1) != 2 {
			t.Fatalf("expected 2 sessions, got %d", len(list1))
		}

		// Now un-delete session-q by removing its manifest
		manifestPath := filepath.Join(tmpDir, ".claude-chronicle", "manifests", "session-q.json")
		os.Remove(manifestPath)

		// Second request without deleted flag — session-q should appear
		// (since its manifest was removed, Deleted should be false)
		req2 := httptest.NewRequest("GET", "/api/sessions", nil)
		w2 := httptest.NewRecorder()
		s.ServeHTTP(w2, req2)

		var list2 []session.SessionInfo
		if err := json.Unmarshal(w2.Body.Bytes(), &list2); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		// Should have both sessions since session-q is no longer deleted
		if len(list2) != 2 {
			ids := make([]string, len(list2))
			for i, s := range list2 {
				ids[i] = s.ID
			}
			t.Fatalf("expected 2 sessions, got %d: %v", len(list2), ids)
		}
	})
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
