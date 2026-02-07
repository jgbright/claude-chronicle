package api

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/jgbright/claude-chronicle/internal/manifest"
)

func TestHandleGetManifest(t *testing.T) {
	t.Run("no manifest returns empty manifest with version 1", func(t *testing.T) {
		setupHandlerTest(t)
		// No manifest file created — Load returns nil

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/test-session-id/manifest", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var m manifest.Manifest
		if err := json.Unmarshal(body, &m); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if m.Version != 1 {
			t.Errorf("version = %d, want 1", m.Version)
		}
		if m.SessionID != "test-session-id" {
			t.Errorf("sessionId = %q, want %q", m.SessionID, "test-session-id")
		}
		if len(m.Edits) != 0 {
			t.Errorf("expected 0 edits, got %d", len(m.Edits))
		}
	})

	t.Run("corrupt manifest returns 500", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		// Create a corrupt manifest file
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(manifestDir, "corrupt-session.json"), []byte("{invalid json"), 0644); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/corrupt-session/manifest", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, body)
		}
	})

	t.Run("existing manifest is returned", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		// Create a manifest file
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		m := manifest.Manifest{
			Version:   1,
			SessionID: "existing-session",
			Edits: []manifest.Edit{
				{Type: "delete", BlockID: "block-1"},
			},
		}
		data, _ := json.Marshal(m)
		if err := os.WriteFile(filepath.Join(manifestDir, "existing-session.json"), data, 0644); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		req := httptest.NewRequest("GET", "/api/sessions/existing-session/manifest", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var result manifest.Manifest
		if err := json.Unmarshal(body, &result); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if len(result.Edits) != 1 {
			t.Fatalf("expected 1 edit, got %d", len(result.Edits))
		}
		if result.Edits[0].Type != "delete" {
			t.Errorf("edit type = %q, want %q", result.Edits[0].Type, "delete")
		}
		if result.Edits[0].BlockID != "block-1" {
			t.Errorf("edit blockId = %q, want %q", result.Edits[0].BlockID, "block-1")
		}
	})
}

func TestHandlePutManifest(t *testing.T) {
	t.Run("valid JSON saves and returns manifest", func(t *testing.T) {
		setupHandlerTest(t)

		body := `{"edits":[{"type":"delete","blockId":"b1"}]}`
		s := newTestServer()
		req := httptest.NewRequest("PUT", "/api/sessions/put-test-session/manifest", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		var m manifest.Manifest
		if err := json.Unmarshal(respBody, &m); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if m.SessionID != "put-test-session" {
			t.Errorf("sessionId = %q, want %q", m.SessionID, "put-test-session")
		}
		if m.Version != 1 {
			t.Errorf("version = %d, want 1 (auto-set)", m.Version)
		}
		if len(m.Edits) != 1 {
			t.Fatalf("expected 1 edit, got %d", len(m.Edits))
		}
	})

	t.Run("invalid JSON returns 400", func(t *testing.T) {
		setupHandlerTest(t)

		s := newTestServer()
		req := httptest.NewRequest("PUT", "/api/sessions/bad-json-session/manifest", strings.NewReader("{invalid"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusBadRequest, body)
		}
	})
}

func TestHandleAddEdit(t *testing.T) {
	t.Run("append edit to non-existing manifest creates new", func(t *testing.T) {
		setupHandlerTest(t)

		edit := `{"type":"annotate","afterBlockId":"b1","content":"note"}`
		s := newTestServer()
		req := httptest.NewRequest("POST", "/api/sessions/new-manifest-session/manifest/edits", strings.NewReader(edit))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var m manifest.Manifest
		if err := json.Unmarshal(body, &m); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if m.SessionID != "new-manifest-session" {
			t.Errorf("sessionId = %q, want %q", m.SessionID, "new-manifest-session")
		}
		if len(m.Edits) != 1 {
			t.Fatalf("expected 1 edit, got %d", len(m.Edits))
		}
		if m.Edits[0].Type != "annotate" {
			t.Errorf("edit type = %q, want %q", m.Edits[0].Type, "annotate")
		}
	})

	t.Run("invalid JSON returns 400", func(t *testing.T) {
		setupHandlerTest(t)

		s := newTestServer()
		req := httptest.NewRequest("POST", "/api/sessions/bad-json-add/manifest/edits", strings.NewReader("{bad"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusBadRequest, body)
		}
	})

	t.Run("corrupt manifest returns 500", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(manifestDir, "corrupt-add.json"), []byte("{bad"), 0644); err != nil {
			t.Fatal(err)
		}

		edit := `{"type":"delete","blockId":"b1"}`
		s := newTestServer()
		req := httptest.NewRequest("POST", "/api/sessions/corrupt-add/manifest/edits", strings.NewReader(edit))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, body)
		}
	})

	t.Run("append edit to existing manifest", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		// Pre-create a manifest with one edit
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		existing := manifest.Manifest{
			Version:   1,
			SessionID: "existing-edits-session",
			Edits:     []manifest.Edit{{Type: "delete", BlockID: "b0"}},
		}
		data, _ := json.Marshal(existing)
		if err := os.WriteFile(filepath.Join(manifestDir, "existing-edits-session.json"), data, 0644); err != nil {
			t.Fatal(err)
		}

		newEdit := `{"type":"collapse","blockIds":["b1","b2"],"summary":"collapsed"}`
		s := newTestServer()
		req := httptest.NewRequest("POST", "/api/sessions/existing-edits-session/manifest/edits", strings.NewReader(newEdit))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var m manifest.Manifest
		if err := json.Unmarshal(body, &m); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if len(m.Edits) != 2 {
			t.Fatalf("expected 2 edits, got %d", len(m.Edits))
		}
		if m.Edits[0].Type != "delete" {
			t.Errorf("first edit type = %q, want %q", m.Edits[0].Type, "delete")
		}
		if m.Edits[1].Type != "collapse" {
			t.Errorf("second edit type = %q, want %q", m.Edits[1].Type, "collapse")
		}
	})
}

func TestHandleDeleteEdit(t *testing.T) {
	// Helper to create a manifest with N edits for delete tests.
	setupManifest := func(t *testing.T, sessionID string, edits []manifest.Edit) {
		t.Helper()
		tmpDir := setupHandlerTest(t)
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		m := manifest.Manifest{
			Version:   1,
			SessionID: sessionID,
			Edits:     edits,
		}
		data, _ := json.Marshal(m)
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), data, 0644); err != nil {
			t.Fatal(err)
		}
	}

	t.Run("delete valid index removes edit", func(t *testing.T) {
		sid := "del-valid-session"
		setupManifest(t, sid, []manifest.Edit{
			{Type: "delete", BlockID: "b0"},
			{Type: "annotate", AfterBlockID: "b1", Content: "note"},
			{Type: "delete", BlockID: "b2"},
		})

		s := newTestServer()
		req := httptest.NewRequest("DELETE", "/api/sessions/"+sid+"/manifest/edits/1", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, body)
		}

		var m manifest.Manifest
		if err := json.Unmarshal(body, &m); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if len(m.Edits) != 2 {
			t.Fatalf("expected 2 edits after delete, got %d", len(m.Edits))
		}
		// The annotate at index 1 should be gone; remaining should be delete b0 and delete b2
		if m.Edits[0].BlockID != "b0" {
			t.Errorf("first edit blockId = %q, want %q", m.Edits[0].BlockID, "b0")
		}
		if m.Edits[1].BlockID != "b2" {
			t.Errorf("second edit blockId = %q, want %q", m.Edits[1].BlockID, "b2")
		}
	})

	t.Run("out of bounds index returns 404", func(t *testing.T) {
		sid := "del-oob-session"
		setupManifest(t, sid, []manifest.Edit{
			{Type: "delete", BlockID: "b0"},
		})

		s := newTestServer()
		req := httptest.NewRequest("DELETE", "/api/sessions/"+sid+"/manifest/edits/5", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNotFound {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusNotFound, body)
		}
	})

	t.Run("non-numeric index returns 400", func(t *testing.T) {
		sid := "del-nan-session"
		setupManifest(t, sid, []manifest.Edit{
			{Type: "delete", BlockID: "b0"},
		})

		s := newTestServer()
		req := httptest.NewRequest("DELETE", "/api/sessions/"+sid+"/manifest/edits/abc", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusBadRequest, body)
		}
	})

	t.Run("corrupt manifest returns 500", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)

		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(manifestDir, "corrupt-del.json"), []byte("{bad"), 0644); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		req := httptest.NewRequest("DELETE", "/api/sessions/corrupt-del/manifest/edits/0", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, body)
		}
	})

	t.Run("no manifest exists returns 404", func(t *testing.T) {
		setupHandlerTest(t) // No manifest created

		s := newTestServer()
		req := httptest.NewRequest("DELETE", "/api/sessions/no-manifest-session/manifest/edits/0", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNotFound {
			body, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusNotFound, body)
		}
	})
}
