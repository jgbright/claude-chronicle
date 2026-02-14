package session

import "strings"

// SearchContent returns true if the lowered search term appears anywhere in
// the session's user text, assistant text blocks, tool result content, or title.
func SearchContent(s *ParsedSession, termLower string) bool {
	// Check session title
	if strings.Contains(strings.ToLower(s.Info.Title), termLower) {
		return true
	}

	for i := range s.Messages {
		msg := &s.Messages[i]

		// User text content
		if msg.TextContent != "" && strings.Contains(strings.ToLower(msg.TextContent), termLower) {
			return true
		}

		// Tool results
		for j := range msg.ToolResults {
			if strings.Contains(strings.ToLower(msg.ToolResults[j].Content), termLower) {
				return true
			}
		}

		// Assistant text blocks
		for j := range msg.Blocks {
			if msg.Blocks[j].Type == "text" && strings.Contains(strings.ToLower(msg.Blocks[j].Text), termLower) {
				return true
			}
		}
	}
	return false
}
