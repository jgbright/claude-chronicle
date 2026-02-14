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

	chronicle "github.com/jgbright/claude-chronicle"
	"github.com/jgbright/claude-chronicle/internal/export"
)

// minimalExportTemplate is a valid export HTML template with the required
// placeholder string that the export engine replaces.
const minimalExportTemplate = `<!DOCTYPE html>
<html data-theme="claude">
<head><title>Chronicle Export</title></head>
<body><script>window.__CHRONICLE_DATA__={}</script></body>
</html>`

func TestHandleExport(t *testing.T) {
	// Override the embedded export template with our minimal test template.
	// The real template is loaded via go:embed at compile time, but we need
	// a predictable template for testing.
	origTemplate := chronicle.ExportTemplate
	chronicle.ExportTemplate = []byte(minimalExportTemplate)
	t.Cleanup(func() { chronicle.ExportTemplate = origTemplate })

	t.Run("default theme returns HTML with content-disposition", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-test-1234-5678-abcd"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		s := newTestServer()
		body := `{"theme":"claude"}`
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		ct := resp.Header.Get("Content-Type")
		if !strings.Contains(ct, "text/html") {
			t.Errorf("Content-Type = %q, want text/html", ct)
		}

		cd := resp.Header.Get("Content-Disposition")
		if !strings.Contains(cd, "attachment") {
			t.Errorf("Content-Disposition = %q, want attachment", cd)
		}
		// The handler uses id[:8] for the filename, so "export-test-1234..." → "chronicle-export-t.html"
		if !strings.Contains(cd, "chronicle-export-t") {
			t.Errorf("Content-Disposition should contain session ID prefix, got %q", cd)
		}

		// Verify the HTML contains injected data (not the empty placeholder)
		htmlStr := string(respBody)
		if strings.Contains(htmlStr, "window.__CHRONICLE_DATA__={}") {
			t.Error("expected template placeholder to be replaced with session data")
		}
		if !strings.Contains(htmlStr, "__CHRONICLE_DATA__") {
			t.Error("expected __CHRONICLE_DATA__ in output HTML")
		}

		// Verify the theme is set
		if !strings.Contains(htmlStr, `data-theme="claude"`) {
			t.Errorf("expected data-theme=\"claude\" in HTML")
		}
	})

	t.Run("copilot theme sets theme in HTML", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-copilot-1234-5678"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		s := newTestServer()
		body := `{"theme":"copilot"}`
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		htmlStr := string(respBody)
		if !strings.Contains(htmlStr, `data-theme="copilot"`) {
			t.Errorf("expected data-theme=\"copilot\" in HTML, got:\n%s", htmlStr)
		}
	})

	t.Run("empty theme defaults to claude", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-default-1234-5678"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		s := newTestServer()
		// Send empty JSON body — theme should default to "claude"
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader(`{}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		htmlStr := string(respBody)
		if !strings.Contains(htmlStr, `data-theme="claude"`) {
			t.Errorf("expected default data-theme=\"claude\" in HTML")
		}
	})

	t.Run("invalid body defaults to claude theme", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-badbody-1234-5678"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		s := newTestServer()
		// Send invalid JSON body — should fallback gracefully to claude theme
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader("not-json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		htmlStr := string(respBody)
		if !strings.Contains(htmlStr, `data-theme="claude"`) {
			t.Errorf("expected fallback data-theme=\"claude\" in HTML")
		}
	})

	t.Run("discovery error returns 500", func(t *testing.T) {
		setupHandlerTest(t)
		// Don't create projects dir — DiscoverSessions will fail

		s := newTestServer()
		body := `{"theme":"claude"}`
		req := httptest.NewRequest("POST", "/api/sessions/nonexistent-session/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			respBody, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusInternalServerError, respBody)
		}
	})

	t.Run("missing session returns 404", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		// Create projects dir so DiscoverSessions doesn't error
		projectsDir := filepath.Join(tmpDir, ".claude", "projects")
		if err := os.MkdirAll(projectsDir, 0755); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		body := `{"theme":"claude"}`
		req := httptest.NewRequest("POST", "/api/sessions/nonexistent-session-id/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNotFound {
			respBody, _ := io.ReadAll(resp.Body)
			t.Errorf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusNotFound, respBody)
		}
	})

	t.Run("manifest load error continues without manifest", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-badmanif-12345678"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		// Create a corrupt manifest
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), []byte("{bad"), 0644); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		body := `{"theme":"claude"}`
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		// Should succeed — manifest error is non-fatal (handler continues without manifest)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}
	})

	t.Run("export includes manifest when present", func(t *testing.T) {
		tmpDir := setupHandlerTest(t)
		sessionID := "export-manifest-1234-abcd"
		createSessionFile(t, tmpDir, "test-project", sessionID, minimalJSONL)

		// Create a manifest for this session with a non-delete edit
		// (delete edits are applied server-side and stripped from the export manifest)
		manifestDir := filepath.Join(tmpDir, ".claude-chronicle", "manifests")
		if err := os.MkdirAll(manifestDir, 0755); err != nil {
			t.Fatal(err)
		}
		m := map[string]interface{}{
			"version":   1,
			"sessionId": sessionID,
			"edits": []map[string]string{
				{"type": "annotate", "afterBlockId": "b1", "content": "note", "id": "a1"},
			},
		}
		data, _ := json.Marshal(m)
		if err := os.WriteFile(filepath.Join(manifestDir, sessionID+".json"), data, 0644); err != nil {
			t.Fatal(err)
		}

		s := newTestServer()
		body := `{"theme":"claude"}`
		req := httptest.NewRequest("POST", "/api/sessions/"+sessionID+"/export", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d; body = %s", resp.StatusCode, http.StatusOK, respBody)
		}

		// Verify the exported HTML contains the chronicle data with manifest
		htmlStr := string(respBody)
		// Parse out the injected data to verify manifest is included
		var exportData export.ExportData
		dataStart := strings.Index(htmlStr, "window.__CHRONICLE_DATA__=") + len("window.__CHRONICLE_DATA__=")
		dataEnd := strings.Index(htmlStr[dataStart:], "</script>")
		jsonStr := htmlStr[dataStart : dataStart+dataEnd]
		if err := json.Unmarshal([]byte(jsonStr), &exportData); err != nil {
			t.Fatalf("failed to parse injected data: %v; json = %s", err, jsonStr)
		}
		if exportData.Manifest == nil {
			t.Error("expected manifest to be included in export data")
		}
	})
}
