package watcher

import (
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// EventType describes what kind of filesystem change was detected.
type EventType string

const (
	// SessionsChanged means a new/deleted .jsonl file or project directory.
	SessionsChanged EventType = "sessions_changed"
	// SessionUpdated means an existing .jsonl file was modified.
	SessionUpdated EventType = "session_updated"
)

// Event is a debounced, classified filesystem change notification.
type Event struct {
	Type      EventType
	SessionID string // set only for SessionUpdated
}

const debounceWindow = 500 * time.Millisecond

// Watcher monitors Claude's projects directory for session file changes.
type Watcher struct {
	fsw    *fsnotify.Watcher
	events chan Event
	done   chan struct{}
	wg     sync.WaitGroup

	projectsDir string
}

// New creates a Watcher for the given projects directory.
// It watches the root directory and all existing project subdirectories.
func New(projectsDir string) (*Watcher, error) {
	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	w := &Watcher{
		fsw:         fsw,
		events:      make(chan Event, 64),
		done:        make(chan struct{}),
		projectsDir: projectsDir,
	}

	// Watch root projects directory (for new project dirs)
	if err := fsw.Add(projectsDir); err != nil {
		fsw.Close()
		return nil, err
	}

	// Watch each existing project subdirectory (for .jsonl file changes)
	entries, err := os.ReadDir(projectsDir)
	if err == nil {
		for _, e := range entries {
			if e.IsDir() {
				_ = fsw.Add(filepath.Join(projectsDir, e.Name()))
			}
		}
	}

	w.wg.Add(1)
	go w.loop()
	return w, nil
}

// Events returns the channel of debounced, classified events.
func (w *Watcher) Events() <-chan Event {
	return w.events
}

// Close stops the watcher and waits for cleanup.
func (w *Watcher) Close() error {
	close(w.done)
	err := w.fsw.Close()
	w.wg.Wait()
	return err
}

// loop is the main event loop that reads raw fsnotify events,
// debounces them, classifies them, and sends them on w.events.
func (w *Watcher) loop() {
	defer w.wg.Done()
	defer close(w.events)

	var timer *time.Timer
	var timerC <-chan time.Time

	// Pending events accumulated during the debounce window.
	// Operations are OR'd together so we see all ops for each path.
	pending := make(map[string]fsnotify.Op)

	for {
		select {
		case <-w.done:
			if timer != nil {
				timer.Stop()
			}
			return

		case ev, ok := <-w.fsw.Events:
			if !ok {
				return
			}
			pending[ev.Name] |= ev.Op

			// Auto-watch new project subdirectories
			if ev.Has(fsnotify.Create) && w.isProjectDir(ev.Name) {
				_ = w.fsw.Add(ev.Name)
			}

			// Reset debounce timer
			if timer == nil {
				timer = time.NewTimer(debounceWindow)
				timerC = timer.C
			} else {
				timer.Reset(debounceWindow)
			}

		case <-timerC:
			// Debounce window elapsed — flush pending events
			w.flush(pending)
			pending = make(map[string]fsnotify.Op)
			timer = nil
			timerC = nil

		case err, ok := <-w.fsw.Errors:
			if !ok {
				return
			}
			log.Printf("watcher error: %v", err)
		}
	}
}

// flush classifies pending events and sends them on w.events.
func (w *Watcher) flush(pending map[string]fsnotify.Op) {
	sessionsChanged := false
	updatedSessions := make(map[string]struct{})

	for name, op := range pending {
		if w.isProjectDir(name) {
			// Only treat directory Create/Remove/Rename as structural changes.
			// Directory Write events fire when file contents change inside the
			// directory (metadata update) and should be ignored here — the file
			// events themselves handle that.
			if op&(fsnotify.Create|fsnotify.Remove|fsnotify.Rename) != 0 {
				sessionsChanged = true
			}
			continue
		}

		if !strings.HasSuffix(name, ".jsonl") {
			continue
		}

		if op&(fsnotify.Create|fsnotify.Remove|fsnotify.Rename) != 0 {
			// New, deleted, or renamed file — structural change
			sessionsChanged = true
		} else if op&fsnotify.Write != 0 {
			// Content modified — existing session updated
			sessionID := strings.TrimSuffix(filepath.Base(name), ".jsonl")
			updatedSessions[sessionID] = struct{}{}
		}
	}

	if sessionsChanged {
		w.send(Event{Type: SessionsChanged})
	}

	for id := range updatedSessions {
		w.send(Event{Type: SessionUpdated, SessionID: id})
	}
}

// send attempts a non-blocking send on the events channel.
func (w *Watcher) send(ev Event) {
	select {
	case w.events <- ev:
	default:
		// Drop event if buffer is full — client catches up on next event
	}
}

// isProjectDir checks if a path is a direct subdirectory of the projects dir.
func (w *Watcher) isProjectDir(path string) bool {
	dir := filepath.Dir(path)
	if dir != w.projectsDir {
		return false
	}
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
