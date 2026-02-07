package manifest

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// manifestDir returns the path to the manifest storage directory.
func manifestDir() string {
	var home string
	if runtime.GOOS == "windows" {
		home = os.Getenv("USERPROFILE")
	} else {
		home = os.Getenv("HOME")
	}
	return filepath.Join(home, ".claude-chronicle", "manifests")
}

func manifestPath(sessionID string) string {
	return filepath.Join(manifestDir(), sessionID+".json")
}

// Load reads a manifest for a session. Returns nil if none exists.
func Load(sessionID string) (*Manifest, error) {
	path := manifestPath(sessionID)
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("reading manifest: %w", err)
	}

	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parsing manifest: %w", err)
	}
	return &m, nil
}

// Save writes a manifest for a session.
func Save(m *Manifest) error {
	dir := manifestDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("creating manifest dir: %w", err)
	}

	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling manifest: %w", err)
	}

	path := manifestPath(m.SessionID)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("writing manifest: %w", err)
	}
	return nil
}
