package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

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

	for i := range m.Edits {
		if err := m.Edits[i].Validate(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
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

	if err := edit.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
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

func (s *Server) handlePatchMetadata(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session ID", http.StatusBadRequest)
		return
	}

	// Decode into a raw map so we only update fields that were actually sent.
	var patch map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
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

	if m.Metadata == nil {
		m.Metadata = &manifest.Metadata{}
	}

	// Merge only the fields present in the patch.
	if raw, ok := patch["title"]; ok {
		var title string
		if err := json.Unmarshal(raw, &title); err != nil {
			http.Error(w, "Invalid title value", http.StatusBadRequest)
			return
		}
		m.Metadata.Title = title
	}
	if raw, ok := patch["deleted"]; ok {
		var deleted bool
		if err := json.Unmarshal(raw, &deleted); err != nil {
			http.Error(w, "Invalid deleted value", http.StatusBadRequest)
			return
		}
		m.Metadata.Deleted = deleted
	}

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

	index, err := strconv.Atoi(indexStr)
	if err != nil || index < 0 {
		http.Error(w, "Invalid index", http.StatusBadRequest)
		return
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
