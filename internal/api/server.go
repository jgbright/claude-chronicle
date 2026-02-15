package api

import (
	"io/fs"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/jgbright/claude-chronicle/internal/session"
	"github.com/jgbright/claude-chronicle/internal/watcher"
)

// BuildInfo holds version metadata injected via ldflags.
type BuildInfo struct {
	Version string `json:"version"`
	Commit  string `json:"commit"`
	Date    string `json:"date"`
	Branch  string `json:"branch,omitempty"`
}

// Server holds the HTTP server configuration.
type Server struct {
	mux       *http.ServeMux
	webFS     fs.FS
	devMode   bool
	devURL    string
	devProxy  *httputil.ReverseProxy
	hub       *Hub
	watcher   *watcher.Watcher
	buildInfo BuildInfo
}

// NewServer creates a new API server.
// webFS should be the embedded web/dist filesystem.
// If devMode is true, non-API requests are proxied to devURL (Vite dev server).
func NewServer(webFS fs.FS, devMode bool, devURL string, buildInfo BuildInfo) *Server {
	s := &Server{
		mux:       http.NewServeMux(),
		webFS:     webFS,
		devMode:   devMode,
		devURL:    devURL,
		hub:       newHub(),
		buildInfo: buildInfo,
	}
	if devMode {
		s.devProxy = newDevReverseProxy(devURL)
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("GET /api/projects", s.handleListProjects)
	s.mux.HandleFunc("GET /api/sessions", s.handleListSessions)
	s.mux.HandleFunc("GET /api/sessions/{id}", s.handleGetSession)

	// Manifest routes
	s.mux.HandleFunc("GET /api/sessions/{id}/manifest", s.handleGetManifest)
	s.mux.HandleFunc("PUT /api/sessions/{id}/manifest", s.handlePutManifest)
	s.mux.HandleFunc("POST /api/sessions/{id}/manifest/edits", s.handleAddEdit)
	s.mux.HandleFunc("DELETE /api/sessions/{id}/manifest/edits/{index}", s.handleDeleteEdit)
	s.mux.HandleFunc("PATCH /api/sessions/{id}/manifest/metadata", s.handlePatchMetadata)

	// Session actions
	s.mux.HandleFunc("POST /api/sessions/{id}/reveal", s.handleRevealSession)

	// Export
	s.mux.HandleFunc("POST /api/sessions/{id}/export", s.handleExport)

	// Build info
	s.mux.HandleFunc("GET /api/info", s.handleInfo)

	// SSE events
	s.mux.HandleFunc("GET /api/events", s.handleSSE)

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

// isHashedAsset checks if a URL path looks like a Vite-hashed asset (e.g. /assets/index-abc123.js).
func isHashedAsset(path string) bool {
	return strings.HasPrefix(path, "/assets/")
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
		// Set cache headers for hashed assets
		if isHashedAsset(r.URL.Path) {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
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
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(data)
}

// handleDevProxy proxies requests to the Vite dev server.
func (s *Server) handleDevProxy(w http.ResponseWriter, r *http.Request) {
	if s.devProxy == nil {
		http.Error(w, "Invalid dev proxy configuration", http.StatusInternalServerError)
		return
	}
	log.Printf("dev proxy: %s -> %s", r.URL.Path, s.devURL)
	s.devProxy.ServeHTTP(w, r)
}

func newDevReverseProxy(rawTarget string) *httputil.ReverseProxy {
	target, err := url.Parse(rawTarget)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return nil
	}

	return httputil.NewSingleHostReverseProxy(target)
}

// StartWatching begins filesystem monitoring and forwards events to SSE clients.
// If watching fails, the server still functions without real-time updates.
func (s *Server) StartWatching(projectsDir string) error {
	w, err := watcher.New(projectsDir)
	if err != nil {
		return err
	}
	s.watcher = w

	go func() {
		for ev := range w.Events() {
			session.InvalidateDiscoveryCache()
			s.hub.broadcast(ev)
		}
	}()

	return nil
}

// Close stops the filesystem watcher if running.
func (s *Server) Close() error {
	if s.watcher != nil {
		return s.watcher.Close()
	}
	return nil
}

// ListenAndServe starts the HTTP server.
func (s *Server) ListenAndServe(addr string) error {
	log.Printf("Starting server on %s", addr)
	return http.ListenAndServe(addr, s)
}

// Serve accepts connections on the given listener and serves HTTP requests.
func (s *Server) Serve(ln net.Listener) error {
	return http.Serve(ln, s)
}
