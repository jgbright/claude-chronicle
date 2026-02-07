package session

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// claudeProjectsDir returns the path to Claude Code's projects directory.
func claudeProjectsDir() string {
	var home string
	if runtime.GOOS == "windows" {
		home = os.Getenv("USERPROFILE")
	} else {
		home = os.Getenv("HOME")
	}
	return filepath.Join(home, ".claude", "projects")
}

// DiscoverSessions scans the Claude projects directory for session JSONL files.
func DiscoverSessions() ([]SessionInfo, error) {
	projectsDir := claudeProjectsDir()

	entries, err := os.ReadDir(projectsDir)
	if err != nil {
		return nil, err
	}

	sessions := make([]SessionInfo, 0)

	for _, projEntry := range entries {
		if !projEntry.IsDir() {
			continue
		}

		projPath := filepath.Join(projectsDir, projEntry.Name())
		files, err := os.ReadDir(projPath)
		if err != nil {
			continue
		}

		for _, f := range files {
			if f.IsDir() || !strings.HasSuffix(f.Name(), ".jsonl") {
				continue
			}

			info, err := f.Info()
			if err != nil {
				continue
			}

			sessionID := strings.TrimSuffix(f.Name(), ".jsonl")
			projectName := decodeProjectName(projEntry.Name())

			sessions = append(sessions, SessionInfo{
				ID:          sessionID,
				ProjectDir:  projEntry.Name(),
				ProjectName: projectName,
				FilePath:    filepath.Join(projPath, f.Name()),
				ModTime:     info.ModTime(),
				SizeBytes:   info.Size(),
			})
		}
	}

	return sessions, nil
}

// decodeProjectName converts the encoded directory name back to a readable path.
// e.g. "D--repos-claude-chronicle" -> "D:/repos/claude-chronicle"
func decodeProjectName(encoded string) string {
	// The format encodes path separators as dashes with drive letter prefix
	if len(encoded) >= 3 && encoded[1] == '-' && encoded[2] == '-' {
		// Looks like a Windows drive path: "D--repos-..." -> "D:/repos/..."
		return string(encoded[0]) + ":/" + strings.ReplaceAll(encoded[3:], "-", "/")
	}
	return strings.ReplaceAll(encoded, "-", "/")
}

// FindSession finds a specific session by ID.
func FindSession(id string) (*SessionInfo, error) {
	sessions, err := DiscoverSessions()
	if err != nil {
		return nil, err
	}

	for _, s := range sessions {
		if s.ID == id {
			return &s, nil
		}
	}

	return nil, nil
}
