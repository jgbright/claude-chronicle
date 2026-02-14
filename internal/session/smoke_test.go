package session

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"testing"
)

// TestSmokeParseRealSessions walks real JSONL session files and verifies they
// parse without error and round-trip through JSON marshaling. This catches
// unexpected data shapes that factory-built test data never produces.
func TestSmokeParseRealSessions(t *testing.T) {
	dir := os.Getenv("CHRONICLE_SMOKE_DIR")
	if dir == "" {
		dir = ClaudeProjectsDir()
	}

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		t.Skipf("smoke directory does not exist: %s", dir)
	}

	// Collect all .jsonl files
	var files []string
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip unreadable entries
		}
		if !info.IsDir() && filepath.Ext(path) == ".jsonl" {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		t.Fatalf("walking smoke directory: %v", err)
	}

	if len(files) == 0 {
		t.Skipf("no .jsonl files found in %s", dir)
	}

	// Sort by mod time descending, limit to 50 newest
	type fileEntry struct {
		path    string
		modTime int64
	}
	entries := make([]fileEntry, 0, len(files))
	for _, f := range files {
		info, err := os.Stat(f)
		if err != nil {
			continue
		}
		entries = append(entries, fileEntry{path: f, modTime: info.ModTime().UnixNano()})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].modTime > entries[j].modTime
	})

	const maxFiles = 50
	if len(entries) > maxFiles {
		entries = entries[:maxFiles]
	}

	t.Logf("smoke-testing %d session files from %s", len(entries), dir)

	for _, entry := range entries {
		name := filepath.Base(entry.path)
		t.Run(name, func(t *testing.T) {
			parsed, err := ParseFile(entry.path)
			if err != nil {
				t.Errorf("ParseFile failed: %v", err)
				return
			}

			// Marshal to JSON and back to verify round-trip
			data, err := json.Marshal(parsed)
			if err != nil {
				t.Errorf("json.Marshal failed: %v", err)
				return
			}

			var roundTripped ParsedSession
			if err := json.Unmarshal(data, &roundTripped); err != nil {
				t.Errorf("json.Unmarshal round-trip failed: %v", err)
				return
			}

			if len(roundTripped.Messages) != len(parsed.Messages) {
				t.Errorf("round-trip message count mismatch: got %d, want %d",
					len(roundTripped.Messages), len(parsed.Messages))
			}
		})
	}
}
