package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	chronicle "github.com/jgbright/claude-chronicle"
	"github.com/jgbright/claude-chronicle/internal/export"
	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

type exportRequest struct {
	Theme string `json:"theme"`
}

func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	var req exportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Theme = "claude"
	}
	if req.Theme == "" {
		req.Theme = "claude"
	}

	// Load session
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
		log.Printf("Error parsing session: %v", err)
		http.Error(w, "Failed to parse session", http.StatusInternalServerError)
		return
	}
	parsed.Info = *info

	// Load manifest
	m, err := manifest.Load(id)
	if err != nil {
		log.Printf("Error loading manifest: %v", err)
		// Continue without manifest
	}

	// Apply manifest title override before export
	if m != nil && m.Metadata != nil && m.Metadata.Title != "" {
		parsed.Info.Title = m.Metadata.Title
	}

	data := &export.ExportData{
		Session:  parsed,
		Manifest: m,
		Theme:    req.Theme,
	}

	html, err := export.GenerateHTML(chronicle.ExportTemplate, data)
	if err != nil {
		log.Printf("Error generating export: %v", err)
		http.Error(w, "Failed to generate export", http.StatusInternalServerError)
		return
	}

	shortID := id
	if len(shortID) > 8 {
		shortID = shortID[:8]
	}
	filename := fmt.Sprintf("chronicle-%s.html", shortID)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Write(html)
}
