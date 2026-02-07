package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"

	"github.com/jgbright/claude-chronicle/internal/session"
)

func (s *Server) handleListSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := session.DiscoverSessions()
	if err != nil {
		log.Printf("Error discovering sessions: %v", err)
		http.Error(w, "Failed to discover sessions", http.StatusInternalServerError)
		return
	}

	// Sort by modification time, newest first
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].ModTime.After(sessions[j].ModTime)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
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

	parsed, err := session.ParseFile(info.FilePath)
	if err != nil {
		log.Printf("Error parsing session %s: %v", id, err)
		http.Error(w, "Failed to parse session", http.StatusInternalServerError)
		return
	}

	parsed.Info = *info

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(parsed)
}
