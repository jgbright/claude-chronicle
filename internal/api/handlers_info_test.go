package api

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func TestHandleInfo(t *testing.T) {
	t.Run("returns build info with branch", func(t *testing.T) {
		webFS := fstest.MapFS{
			"index.html": {Data: []byte("<html>test</html>")},
		}
		info := BuildInfo{
			Version: "0.1.0",
			Commit:  "abc1234",
			Date:    "2025-01-15",
			Branch:  "feat/my-feature",
		}
		s := NewServer(webFS, false, "", info)

		req := httptest.NewRequest("GET", "/api/info", nil)
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

		var got BuildInfo
		if err := json.Unmarshal(body, &got); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if got.Version != "0.1.0" {
			t.Errorf("version = %q, want %q", got.Version, "0.1.0")
		}
		if got.Commit != "abc1234" {
			t.Errorf("commit = %q, want %q", got.Commit, "abc1234")
		}
		if got.Branch != "feat/my-feature" {
			t.Errorf("branch = %q, want %q", got.Branch, "feat/my-feature")
		}
	})

	t.Run("empty branch omitted from JSON", func(t *testing.T) {
		webFS := fstest.MapFS{
			"index.html": {Data: []byte("<html>test</html>")},
		}
		info := BuildInfo{
			Version: "0.1.0",
			Commit:  "abc1234",
			Date:    "2025-01-15",
			Branch:  "",
		}
		s := NewServer(webFS, false, "", info)

		req := httptest.NewRequest("GET", "/api/info", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}

		// Verify the raw JSON does not contain "branch" key
		var raw map[string]interface{}
		if err := json.Unmarshal(body, &raw); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		if _, ok := raw["branch"]; ok {
			t.Error("expected branch key to be omitted from JSON when empty")
		}
	})
}
