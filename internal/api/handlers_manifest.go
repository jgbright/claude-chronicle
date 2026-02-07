package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jgbright/claude-chronicle/internal/manifest"
)

func (s *Server) handleGetManifest(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	m, err := manifest.Load(id)
	if err != nil {
		log.Printf("Error loading manifest: %v", err)
		http.Error(w, "Failed to load manifest", http.StatusInternalServerError)
		return
	}

	if m == nil {
		// Return empty manifest
		m = &manifest.Manifest{
			Version:   1,
			SessionID: id,
			Edits:     []manifest.Edit{},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

func (s *Server) handlePutManifest(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	var m manifest.Manifest
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	m.SessionID = id
	if m.Version == 0 {
		m.Version = 1
	}

	if err := manifest.Save(&m); err != nil {
		log.Printf("Error saving manifest: %v", err)
		http.Error(w, "Failed to save manifest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

func (s *Server) handleAddEdit(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	var edit manifest.Edit
	if err := json.NewDecoder(r.Body).Decode(&edit); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	m, err := manifest.Load(id)
	if err != nil {
		log.Printf("Error loading manifest: %v", err)
		http.Error(w, "Failed to load manifest", http.StatusInternalServerError)
		return
	}

	if m == nil {
		m = &manifest.Manifest{
			Version:   1,
			SessionID: id,
			Edits:     []manifest.Edit{},
		}
	}

	m.Edits = append(m.Edits, edit)

	if err := manifest.Save(m); err != nil {
		log.Printf("Error saving manifest: %v", err)
		http.Error(w, "Failed to save manifest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

func (s *Server) handleDeleteEdit(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	indexStr := r.PathValue("index")
	if id == "" || indexStr == "" {
		http.Error(w, "Missing parameters", http.StatusBadRequest)
		return
	}

	var index int
	for _, c := range indexStr {
		if c < '0' || c > '9' {
			http.Error(w, "Invalid index", http.StatusBadRequest)
			return
		}
		index = index*10 + int(c-'0')
	}

	m, err := manifest.Load(id)
	if err != nil {
		log.Printf("Error loading manifest: %v", err)
		http.Error(w, "Failed to load manifest", http.StatusInternalServerError)
		return
	}

	if m == nil || index >= len(m.Edits) {
		http.Error(w, "Edit not found", http.StatusNotFound)
		return
	}

	m.Edits = append(m.Edits[:index], m.Edits[index+1:]...)

	if err := manifest.Save(m); err != nil {
		log.Printf("Error saving manifest: %v", err)
		http.Error(w, "Failed to save manifest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}
