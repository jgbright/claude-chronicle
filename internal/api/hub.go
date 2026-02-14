package api

import (
	"sync"

	"github.com/jgbright/claude-chronicle/internal/watcher"
)

// sseClient represents a connected SSE client.
type sseClient struct {
	events chan watcher.Event
	done   chan struct{}
}

// Hub manages connected SSE clients and broadcasts events to them.
type Hub struct {
	mu      sync.RWMutex
	clients map[*sseClient]struct{}
}

// newHub creates a new Hub.
func newHub() *Hub {
	return &Hub{
		clients: make(map[*sseClient]struct{}),
	}
}

// addClient registers a new SSE client and returns it.
func (h *Hub) addClient() *sseClient {
	c := &sseClient{
		events: make(chan watcher.Event, 16),
		done:   make(chan struct{}),
	}
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
	return c
}

// removeClient unregisters an SSE client.
func (h *Hub) removeClient(c *sseClient) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
	close(c.done)
}

// broadcast sends an event to all connected clients.
// Non-blocking: drops events for clients with full buffers.
func (h *Hub) broadcast(ev watcher.Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		select {
		case c.events <- ev:
		default:
			// Client buffer full — drop event
		}
	}
}
