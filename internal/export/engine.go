package export

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jgbright/claude-chronicle/internal/manifest"
	"github.com/jgbright/claude-chronicle/internal/session"
)

// ValidThemes is the set of allowed theme names.
var ValidThemes = map[string]bool{
	"claude":  true,
	"copilot": true,
}

// ExportData is the data structure injected into the HTML template.
type ExportData struct {
	Session  *session.ParsedSession `json:"session"`
	Manifest *manifest.Manifest     `json:"manifest"`
	Theme    string                 `json:"theme"`
}

// GenerateHTML takes the export template and injects session data.
// It applies server-side sanitization: manifest deletes are physically
// applied, metadata is stripped, and home directory paths are normalized.
func GenerateHTML(template []byte, data *ExportData) ([]byte, error) {
	if !ValidThemes[data.Theme] {
		data.Theme = "claude"
	}

	// Sanitize before marshaling: apply deletes, strip metadata, normalize paths
	sanitized := SanitizeForExport(data)

	jsonData, err := json.Marshal(sanitized)
	if err != nil {
		return nil, fmt.Errorf("marshaling export data: %w", err)
	}

	html := string(template)

	// Replace the placeholder data
	html = strings.Replace(
		html,
		"window.__CHRONICLE_DATA__={}",
		"window.__CHRONICLE_DATA__="+string(jsonData),
		1,
	)

	// Set the theme
	html = strings.Replace(
		html,
		`data-theme="claude"`,
		fmt.Sprintf(`data-theme="%s"`, data.Theme),
		1,
	)

	return []byte(html), nil
}
