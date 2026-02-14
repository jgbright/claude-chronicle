package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"time"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

// ProjectSummary represents a project with its session count.
type ProjectSummary struct {
	Name         string    `json:"name"`
	Dir          string    `json:"dir"`
	SessionCount int       `json:"sessionCount"`
	LastActivity time.Time `json:"lastActivity"`
}

func (s *Server) handleListProjects(w http.ResponseWriter, r *http.Request) {
	sessions, err := session.DiscoverSessions()
	if err != nil {
		log.Printf("Error discovering sessions: %v", err)
		http.Error(w, "Failed to discover sessions", http.StatusInternalServerError)
		return
	}

	// Group by ProjectDir, counting only non-deleted sessions
	groups := make(map[string]*ProjectSummary)
	for _, sess := range sessions {
		if _, ok := groups[sess.ProjectDir]; !ok {
			groups[sess.ProjectDir] = &ProjectSummary{
				Name: sess.ProjectName,
				Dir:  sess.ProjectDir,
			}
		}

		// Check manifest to see if this session is soft-deleted
		deleted := false
		m, err := manifest.Load(sess.ID)
		if err == nil && m != nil && m.Metadata != nil && m.Metadata.Deleted {
			deleted = true
		}

		if !deleted {
			groups[sess.ProjectDir].SessionCount++
		}
		if sess.ModTime.After(groups[sess.ProjectDir].LastActivity) {
			groups[sess.ProjectDir].LastActivity = sess.ModTime
		}
	}

	// Convert to slice, excluding projects with zero visible sessions,
	// and sort by most recent activity (descending)
	projects := make([]ProjectSummary, 0, len(groups))
	for _, p := range groups {
		if p.SessionCount == 0 {
			continue
		}
		projects = append(projects, *p)
	}
	sort.Slice(projects, func(i, j int) bool {
		return projects[i].LastActivity.After(projects[j].LastActivity)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}
