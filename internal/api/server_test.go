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
	devURL := "http://localhost:5173"
	s := NewServer(nil, true, devURL, BuildInfo{})

	t.Run("path is preserved", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/src/main.tsx", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusTemporaryRedirect {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusTemporaryRedirect)
		}
		loc := resp.Header.Get("Location")
		if loc != "http://localhost:5173/src/main.tsx" {
			t.Errorf("Location = %q, want %q", loc, "http://localhost:5173/src/main.tsx")
		}
	})

	t.Run("query string is preserved", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/test?foo=bar&baz=1", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		loc := resp.Header.Get("Location")
		if loc != "http://localhost:5173/api/test?foo=bar&baz=1" {
			t.Errorf("Location = %q, want %q", loc, "http://localhost:5173/api/test?foo=bar&baz=1")
		}
	})

	t.Run("root path is proxied", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusTemporaryRedirect {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusTemporaryRedirect)
		}
		loc := resp.Header.Get("Location")
		if loc != "http://localhost:5173/" {
			t.Errorf("Location = %q, want %q", loc, "http://localhost:5173/")
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
