package session

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// ClaudeProjectsDir returns the path to Claude Code's projects directory.
// If CHRONICLE_DATA_DIR is set, that value is used instead of the default.
func ClaudeProjectsDir() string {
	if override := os.Getenv("CHRONICLE_DATA_DIR"); override != "" {
		return override
	}
	var home string
	if runtime.GOOS == "windows" {
		home = os.Getenv("USERPROFILE")
	} else {
		home = os.Getenv("HOME")
	}
	return filepath.Join(home, ".claude", "projects")
}

// discoveryCache caches the result of DiscoverSessions to avoid
// repeated filesystem walks within a short window.
var discoveryCache struct {
	sync.RWMutex
	sessions []SessionInfo
	expires  time.Time
}

const discoveryCacheTTL = 5 * time.Second

// DiscoverSessions scans the Claude projects directory for session JSONL files.
// Results are cached for a short TTL to avoid redundant filesystem walks.
func DiscoverSessions() ([]SessionInfo, error) {
	discoveryCache.RLock()
	if time.Now().Before(discoveryCache.expires) && discoveryCache.sessions != nil {
		result := discoveryCache.sessions
		discoveryCache.RUnlock()
		return result, nil
	}
	discoveryCache.RUnlock()

	sessions, err := discoverSessionsUncached()
	if err != nil {
		return nil, err
	}

	discoveryCache.Lock()
	discoveryCache.sessions = sessions
	discoveryCache.expires = time.Now().Add(discoveryCacheTTL)
	discoveryCache.Unlock()

	return sessions, nil
}

// InvalidateDiscoveryCache forces the next DiscoverSessions call to rescan.
func InvalidateDiscoveryCache() {
	discoveryCache.Lock()
	discoveryCache.sessions = nil
	discoveryCache.expires = time.Time{}
	discoveryCache.Unlock()
}

// discoverSessionsUncached performs the actual filesystem scan.
func discoverSessionsUncached() ([]SessionInfo, error) {
	projectsDir := ClaudeProjectsDir()

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
			filePath := filepath.Join(projPath, f.Name())

			// Quick-scan for cwd and title
			meta := scanSessionMetadata(filePath)

			projectName := decodeProjectName(projEntry.Name())
			if meta.CWD != "" {
				projectName = meta.CWD
			}

			sessions = append(sessions, SessionInfo{
				ID:          sessionID,
				ProjectDir:  projEntry.Name(),
				ProjectName: projectName,
				FilePath:    filePath,
				ModTime:     info.ModTime(),
				SizeBytes:   info.Size(),
				Title:       meta.Title,
			})
		}
	}

	return sessions, nil
}

// sessionMetadata holds quick-scanned metadata from a JSONL file.
type sessionMetadata struct {
	CWD   string // first cwd found
	Title string // first user text message (used as title)
}

// metadataRecord is a minimal struct for quick-scanning JSONL records.
type metadataRecord struct {
	Type    string          `json:"type"`
	CWD     string          `json:"cwd"`
	Message json.RawMessage `json:"message"`
}

// metadataMessage is a minimal struct for extracting role and content from a message.
type metadataMessage struct {
	Role    string          `json:"role"`
	Content json.RawMessage `json:"content"`
}

// scanSessionMetadata reads the first ~50 lines of a JSONL file to extract
// cwd (for the real project path) and the first user message (as title).
func scanSessionMetadata(path string) sessionMetadata {
	f, err := os.Open(path)
	if err != nil {
		return sessionMetadata{}
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	var meta sessionMetadata
	lines := 0
	maxLines := 50

	for scanner.Scan() && lines < maxLines {
		lines++
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var rec metadataRecord
		if err := json.Unmarshal(line, &rec); err != nil {
			continue
		}

		// Extract cwd from the first record that has it
		if meta.CWD == "" && rec.CWD != "" {
			meta.CWD = rec.CWD
		}

		// Extract first user text as title
		if meta.Title == "" && (rec.Type == "human" || rec.Type == "user") && len(rec.Message) > 0 {
			var msg metadataMessage
			if err := json.Unmarshal(rec.Message, &msg); err == nil && msg.Role == "user" {
				meta.Title = extractUserText(msg.Content)
			}
		}

		// Stop early if we have everything
		if meta.CWD != "" && meta.Title != "" {
			break
		}
	}

	return meta
}

// extractUserText extracts a short title from user message content.
// Content can be a plain string or an array of content blocks.
func extractUserText(raw json.RawMessage) string {
	// Try as plain string first
	var s string
	if err := json.Unmarshal(raw, &s); err == nil {
		return truncateTitle(s)
	}

	// Try as array of content blocks
	var blocks []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &blocks); err == nil {
		for _, b := range blocks {
			if b.Type == "text" && b.Text != "" {
				return truncateTitle(b.Text)
			}
		}
	}

	return ""
}

// truncateTitle returns the first line of text, capped at 100 chars.
func truncateTitle(s string) string {
	// Take only the first line
	if idx := strings.IndexAny(s, "\r\n"); idx >= 0 {
		s = s[:idx]
	}
	s = strings.TrimSpace(s)
	if len(s) > 100 {
		s = s[:97] + "..."
	}
	return s
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
