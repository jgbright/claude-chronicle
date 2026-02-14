package api

import (
	"fmt"
	"net/http"

	"github.com/jgbright/claude-chronicle/internal/watcher"
)

// handleSSE streams server-sent events to the client.
func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	client := s.hub.addClient()
	defer s.hub.removeClient(client)

	// Send initial connected event
	fmt.Fprintf(w, "event: connected\ndata: {}\n\n")
	flusher.Flush()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-client.done:
			return
		case ev := <-client.events:
			switch ev.Type {
			case watcher.SessionsChanged:
				fmt.Fprintf(w, "data: {\"type\":\"sessions_changed\"}\n\n")
			case watcher.SessionUpdated:
				fmt.Fprintf(w, "data: {\"type\":\"session_updated\",\"sessionId\":\"%s\"}\n\n", ev.SessionID)
			}
			flusher.Flush()
		}
	}
}
