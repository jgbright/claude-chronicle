package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

func (s *Server) handleListSessions(w http.ResponseWriter, r *http.Request) {
	cached, err := session.DiscoverSessions()
	if err != nil {
		log.Printf("Error discovering sessions: %v", err)
		http.Error(w, "Failed to discover sessions", http.StatusInternalServerError)
		return
	}

	// Copy cached slice so we don't mutate the discovery cache.
	sessions := make([]session.SessionInfo, len(cached))
	copy(sessions, cached)

	// Apply manifest metadata overrides (title, deleted)
	for i := range sessions {
		m, err := manifest.Load(sessions[i].ID)
		if err != nil {
			continue
		}
		if m != nil && m.Metadata != nil {
			if m.Metadata.Title != "" {
				sessions[i].Title = m.Metadata.Title
			}
			if m.Metadata.Deleted {
				sessions[i].Deleted = true
			}
		}
	}

	// Parse optional filters
	showDeleted := r.URL.Query().Get("deleted") == "true"
	projectFilter := r.URL.Query().Get("project")
	searchTerm := r.URL.Query().Get("q")
	searchLower := strings.ToLower(searchTerm)

	// Apply filters — use a new slice to avoid corrupting the copy.
	filtered := make([]session.SessionInfo, 0, len(sessions))
	for i := range sessions {
		// Deleted filter: exclude deleted sessions unless ?deleted=true
		if sessions[i].Deleted && !showDeleted {
			continue
		}

		// Project filter (cheap, metadata-only)
		if projectFilter != "" && sessions[i].ProjectDir != projectFilter {
			continue
		}

		// Title search (cheap, already loaded)
		if searchLower != "" {
			titleMatch := strings.Contains(strings.ToLower(sessions[i].Title), searchLower)

			// Full content search (expensive, requires parse)
			if !titleMatch {
				parsed, err := session.ParseFileWithCache(sessions[i].FilePath)
				if err != nil {
					continue
				}
				parsed.Info = sessions[i]
				if !session.SearchContent(parsed, searchLower) {
					continue
				}
			}
		}

		filtered = append(filtered, sessions[i])
	}

	// Sort by modification time, newest first
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].ModTime.After(filtered[j].ModTime)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filtered)
}

// sessionWithManifest is the combined response for GET /api/sessions/{id}.
type sessionWithManifest struct {
	*session.ParsedSession
	Manifest *manifest.Manifest `json:"manifest"`
}

func (s *Server) handleGetSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	info, err := session.FindSession(id)
	if err != nil {
		log.Printf("Error finding session: %v", err)
		http.Error(w, "Failed to find session", http.StatusInternalServerError)
		return
	}
	if info == nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	parsed, err := session.ParseFileWithCache(info.FilePath)
	if err != nil {
		log.Printf("Error parsing session %s: %v", id, err)
		http.Error(w, "Failed to parse session", http.StatusInternalServerError)
		return
	}

	parsed.Info = *info

	// Load manifest
	m, err := manifest.Load(id)
	if err != nil {
		log.Printf("Error loading manifest for session %s: %v", id, err)
		// Continue without manifest
	}

	// Apply manifest title override
	if m != nil && m.Metadata != nil && m.Metadata.Title != "" {
		parsed.Info.Title = m.Metadata.Title
	}

	// Return empty manifest if none exists
	if m == nil {
		m = &manifest.Manifest{
			Version:   1,
			SessionID: id,
			Edits:     []manifest.Edit{},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessionWithManifest{
		ParsedSession: parsed,
		Manifest:      m,
	})
}

func (s *Server) handleRevealSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	info, err := session.FindSession(id)
	if err != nil {
		log.Printf("Error finding session: %v", err)
		http.Error(w, "Failed to find session", http.StatusInternalServerError)
		return
	}
	if info == nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	filePath := info.FilePath
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", fmt.Sprintf("/select,%s", filePath))
	case "darwin":
		cmd = exec.Command("open", "-R", filePath)
	default:
		// Linux: open the containing directory
		cmd = exec.Command("xdg-open", filepath.Dir(filePath))
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Error revealing session file: %v", err)
		http.Error(w, "Failed to open file explorer", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
