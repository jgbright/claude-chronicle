package api

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestHandleSPA(t *testing.T) {
	webFS := fstest.MapFS{
		"index.html":        {Data: []byte("<html>SPA</html>")},
		"assets/app.js":     {Data: []byte("console.log('app')")},
		"assets/style.css":  {Data: []byte("body{}")},
	}

	s := NewServer(webFS, false, "", BuildInfo{})

	t.Run("root serves index.html", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if !strings.Contains(string(body), "SPA") {
			t.Errorf("expected SPA content, got %q", string(body))
		}
	})

	t.Run("existing static file served directly", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/assets/app.js", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}
		if !strings.Contains(string(body), "console.log") {
			t.Errorf("expected JS content, got %q", string(body))
		}
	})

	t.Run("SPA fallback for non-file paths", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/sessions/abc-123", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}
		ct := resp.Header.Get("Content-Type")
		if !strings.Contains(ct, "text/html") {
			t.Errorf("Content-Type = %q, want text/html", ct)
		}
		if !strings.Contains(string(body), "SPA") {
			t.Errorf("expected SPA content for fallback, got %q", string(body))
		}
	})

	t.Run("missing index.html returns 404", func(t *testing.T) {
		emptyFS := fstest.MapFS{}
		s2 := NewServer(emptyFS, false, "", BuildInfo{})

		req := httptest.NewRequest("GET", "/unknown-path", nil)
		w := httptest.NewRecorder()
		s2.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusNotFound)
		}
	})
}

func TestHandleDevProxy(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Upstream-Path", r.URL.Path)
		w.Header().Set("X-Upstream-Query", r.URL.RawQuery)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	s := NewServer(nil, true, upstream.URL, BuildInfo{})

	t.Run("path is preserved", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/src/main.tsx", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNoContent {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusNoContent)
		}
		gotPath := resp.Header.Get("X-Upstream-Path")
		if gotPath != "/src/main.tsx" {
			t.Errorf("X-Upstream-Path = %q, want %q", gotPath, "/src/main.tsx")
		}
	})

	t.Run("query string is preserved", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test?foo=bar&baz=1", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNoContent {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusNoContent)
		}
		gotPath := resp.Header.Get("X-Upstream-Path")
		if gotPath != "/api/test" {
			t.Errorf("X-Upstream-Path = %q, want %q", gotPath, "/api/test")
		}
		gotQuery := resp.Header.Get("X-Upstream-Query")
		if gotQuery != "foo=bar&baz=1" && gotQuery != "baz=1&foo=bar" {
			t.Errorf("X-Upstream-Query = %q, want foo=bar&baz=1 (order-insensitive)", gotQuery)
		}
	})

	t.Run("root path is proxied", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusNoContent {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusNoContent)
		}
		gotPath := resp.Header.Get("X-Upstream-Path")
		if gotPath != "/" {
			t.Errorf("X-Upstream-Path = %q, want %q", gotPath, "/")
		}
	})
}

func TestServeHTTP(t *testing.T) {
	webFS := fstest.MapFS{
		"index.html": {Data: []byte("<html>Test</html>")},
	}
	s := NewServer(webFS, false, "", BuildInfo{})

	t.Run("implements http.Handler", func(t *testing.T) {
		// Verify that Server implements http.Handler by using it with httptest.Server
		ts := httptest.NewServer(s)
		defer ts.Close()

		resp, err := http.Get(ts.URL + "/")
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}
	})
}
