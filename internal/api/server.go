package api

import (
	"io/fs"
	"log"
	"net/http"
	"strings"
)

// Server holds the HTTP server configuration.
type Server struct {
	mux    *http.ServeMux
	webFS  fs.FS
	devMode bool
	devURL  string
}

// NewServer creates a new API server.
// webFS should be the embedded web/dist filesystem.
// If devMode is true, non-API requests are proxied to devURL (Vite dev server).
func NewServer(webFS fs.FS, devMode bool, devURL string) *Server {
	s := &Server{
		mux:     http.NewServeMux(),
		webFS:   webFS,
		devMode: devMode,
		devURL:  devURL,
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("GET /api/sessions", s.handleListSessions)
	s.mux.HandleFunc("GET /api/sessions/{id}", s.handleGetSession)

	// Manifest routes
	s.mux.HandleFunc("GET /api/sessions/{id}/manifest", s.handleGetManifest)
	s.mux.HandleFunc("PUT /api/sessions/{id}/manifest", s.handlePutManifest)
	s.mux.HandleFunc("POST /api/sessions/{id}/manifest/edits", s.handleAddEdit)
	s.mux.HandleFunc("DELETE /api/sessions/{id}/manifest/edits/{index}", s.handleDeleteEdit)

	// Export
	s.mux.HandleFunc("POST /api/sessions/{id}/export", s.handleExport)

	// SPA fallback: serve static files, fall back to index.html
	if s.devMode {
		s.mux.HandleFunc("/", s.handleDevProxy)
	} else {
		s.mux.HandleFunc("/", s.handleSPA)
	}
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

// handleSPA serves the embedded SPA files with index.html fallback.
func (s *Server) handleSPA(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "index.html"
	} else {
		path = strings.TrimPrefix(path, "/")
	}

	// Try to serve the exact file
	f, err := s.webFS.Open(path)
	if err == nil {
		f.Close()
		http.FileServerFS(s.webFS).ServeHTTP(w, r)
		return
	}

	// SPA fallback: serve index.html for any non-file path
	data, err := fs.ReadFile(s.webFS, "index.html")
	if err != nil {
		http.Error(w, "SPA not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

// handleDevProxy proxies requests to the Vite dev server.
func (s *Server) handleDevProxy(w http.ResponseWriter, r *http.Request) {
	target := s.devURL + r.URL.Path
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery
	}

	log.Printf("dev proxy: %s -> %s", r.URL.Path, target)
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}

// ListenAndServe starts the HTTP server.
func (s *Server) ListenAndServe(addr string) error {
	log.Printf("Starting server on %s", addr)
	return http.ListenAndServe(addr, s)
}
