package session

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"
)

// parseCacheEntry holds a cached parsed session with its file modification time.
type parseCacheEntry struct {
	mtime   time.Time
	session *ParsedSession
}

// parseCache caches parsed sessions keyed by file path with mtime-based invalidation.
var parseCache struct {
	sync.RWMutex
	entries map[string]parseCacheEntry
}

const parseCacheMaxEntries = 50

func init() {
	parseCache.entries = make(map[string]parseCacheEntry)
}

// ParseFileWithCache returns a cached ParsedSession if the file hasn't changed,
// otherwise parses the file and caches the result.
func ParseFileWithCache(path string) (*ParsedSession, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat session file: %w", err)
	}
	mtime := info.ModTime()

	parseCache.RLock()
	if entry, ok := parseCache.entries[path]; ok && entry.mtime.Equal(mtime) {
		parseCache.RUnlock()
		return entry.session, nil
	}
	parseCache.RUnlock()

	session, err := ParseFile(path)
	if err != nil {
		return nil, err
	}

	parseCache.Lock()
	// Evict oldest entries if at capacity
	if len(parseCache.entries) >= parseCacheMaxEntries {
		// Simple eviction: clear the entire cache when full
		parseCache.entries = make(map[string]parseCacheEntry)
	}
	parseCache.entries[path] = parseCacheEntry{mtime: mtime, session: session}
	parseCache.Unlock()

	return session, nil
}

// ParseFile reads a JSONL session file and returns merged, display-ready messages.
func ParseFile(path string) (*ParsedSession, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("opening session file: %w", err)
	}
	defer f.Close()

	var records []Record
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 1024*1024), 10*1024*1024) // 10MB max line

	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var rec Record
		if err := json.Unmarshal(line, &rec); err != nil {
			// Skip unparseable lines
			continue
		}
		records = append(records, rec)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scanning session file: %w", err)
	}

	messages := mergeRecords(records)
	return &ParsedSession{Messages: messages}, nil
}

// shouldSkipRecord returns true for record types we don't render.
func shouldSkipRecord(rec *Record) bool {
	switch rec.Type {
	case "file-history-snapshot", "progress":
		return true
	}
	if rec.IsMeta {
		return true
	}
	if rec.Message.Role == "" {
		return true
	}
	return false
}

// mergeRecords processes raw records into display-ready messages.
// Assistant records sharing the same message.id are merged into one message.
func mergeRecords(records []Record) []Message {
	messages := make([]Message, 0)
	assistantMessages := make(map[string]int) // message.id -> index in messages

	for i := range records {
		rec := &records[i]
		if shouldSkipRecord(rec) {
			continue
		}

		switch rec.Message.Role {
		case "user":
			msg := parseUserRecord(rec)
			if msg != nil {
				messages = append(messages, *msg)
			}

		case "assistant":
			blocks := parseContentBlocks(rec.Message.Content)
			if len(blocks) == 0 {
				continue
			}

			msgID := rec.Message.ID
			if msgID == "" {
				// No message ID, treat as standalone
				messages = append(messages, Message{
					Role:      "assistant",
					Timestamp: rec.Timestamp,
					Blocks:    blocks,
				})
				continue
			}

			if idx, ok := assistantMessages[msgID]; ok {
				// Merge into existing message
				messages[idx].Blocks = append(messages[idx].Blocks, blocks...)
			} else {
				// New assistant message
				assistantMessages[msgID] = len(messages)
				messages = append(messages, Message{
					ID:        msgID,
					Role:      "assistant",
					Timestamp: rec.Timestamp,
					Blocks:    blocks,
				})
			}
		}
	}

	return messages
}

// parseUserRecord converts a user record into a Message.
func parseUserRecord(rec *Record) *Message {
	msg := &Message{
		ID:        rec.UUID,
		Role:      "user",
		Timestamp: rec.Timestamp,
	}

	// Content can be a string or []ContentBlock
	content := rec.Message.Content
	if len(content) == 0 {
		return nil
	}

	// Try as string first
	var textContent string
	if err := json.Unmarshal(content, &textContent); err == nil {
		// Skip command/system messages
		if strings.HasPrefix(textContent, "<local-command") ||
			strings.HasPrefix(textContent, "<command-name>") {
			return nil
		}
		msg.TextContent = textContent
		return msg
	}

	// Try as array of content blocks (tool results)
	var blocks []ContentBlock
	if err := json.Unmarshal(content, &blocks); err == nil {
		for _, block := range blocks {
			if block.Type == "tool_result" {
				tr := ToolResult{
					ToolUseID: block.ToolUseID,
					IsError:   block.IsError,
				}

				// Parse the tool_result content (can be string or array)
				if len(block.Content) > 0 {
					var s string
					if err := json.Unmarshal(block.Content, &s); err == nil {
						tr.Content = s
					} else {
						// Array of content blocks within the tool result
						tr.Content = string(block.Content)
					}
				}

				// Parse toolUseResult metadata
				if len(rec.ToolUseResult) > 0 {
					var turd ToolUseResultData
					if err := json.Unmarshal(rec.ToolUseResult, &turd); err == nil {
						tr.Result = &turd
					}
				}

				msg.ToolResults = append(msg.ToolResults, tr)
			}
		}
		if len(msg.ToolResults) > 0 {
			return msg
		}
	}

	return nil
}

// parseContentBlocks parses the content field as an array of ContentBlock.
func parseContentBlocks(raw json.RawMessage) []ContentBlock {
	if len(raw) == 0 {
		return nil
	}

	var blocks []ContentBlock
	if err := json.Unmarshal(raw, &blocks); err != nil {
		// Try as string
		var text string
		if err := json.Unmarshal(raw, &text); err == nil && text != "" {
			return []ContentBlock{{Type: "text", Text: text}}
		}
		return nil
	}
	return blocks
}
