# Data Flow

End-to-end trace of how data moves from JSONL files on disk to rendered pixels on screen.

## Overview

Chronicle has two rendering paths that share most of the pipeline but diverge at data loading:

```
                          +-------------------+
                          | JSONL files on    |
                          | disk (~/.claude/) |
                          +---------+---------+
                                    |
                          +---------v---------+
                          | Session discovery |
                          | & JSONL parsing   |
                          | (Go backend)      |
                          +---------+---------+
                                    |
                    +---------------+---------------+
                    |                               |
          +---------v---------+           +---------v---------+
          |    SPA Path       |           |   Export Path      |
          |  (live server)    |           | (single-file HTML) |
          +---------+---------+           +---------+---------+
                    |                               |
          JSON over HTTP                 JSON injected into
          from /api/*                    window.__CHRONICLE_DATA__
                    |                               |
          +---------v---------+           +---------v---------+
          |   main.tsx        |           | export-main.tsx    |
          |   App -> fetch    |           | ExportViewer       |
          +---------+---------+           +---------+---------+
                    |                               |
                    +---------------+---------------+
                                    |
                          +---------v---------+
                          | sessionTransform  |
                          | (apply manifest)  |
                          +---------+---------+
                                    |
                          +---------v---------+
                          | SessionViewer ->   |
                          | MessageBlock       |
                          | (render pixels)    |
                          +--------------------+
```

Both paths use the same Go parser, the same `sessionTransform.ts` manifest logic, and the same React rendering components. The only difference is how the frontend receives the data.

## Session Discovery

**File**: `internal/session/discovery.go`

The `DiscoverSessions()` function scans Claude Code's session storage directory for JSONL files:

```
~/.claude/projects/
  D--repos-claude-chronicle/
    abc123.jsonl
    def456.jsonl
  home-other-project/
    ghi789.jsonl
```

The home directory is resolved cross-platform (`discovery.go:11-18`):

```go
func claudeProjectsDir() string {
    var home string
    if runtime.GOOS == "windows" {
        home = os.Getenv("USERPROFILE")
    } else {
        home = os.Getenv("HOME")
    }
    return filepath.Join(home, ".claude", "projects")
}
```

### Project Name Decoding

Directory names use an encoded form of the original filesystem path. `decodeProjectName()` (`discovery.go:72-79`) reverses this:

| Encoded directory name       | Decoded project name              |
|------------------------------|-----------------------------------|
| `D--repos-claude-chronicle`  | `D:/repos/claude-chronicle`       |
| `home-other-project`         | `home/other/project`              |

The logic: if the name starts with a letter followed by `--` (e.g., `D--`), it is a Windows drive path. The first character becomes the drive letter, `--` becomes `:/`, and remaining `-` become `/`. Otherwise all `-` become `/`.

Each discovered JSONL file produces a `SessionInfo` struct:

```go
type SessionInfo struct {
    ID          string    `json:"id"`          // filename without .jsonl
    ProjectDir  string    `json:"projectDir"`  // encoded dir name
    ProjectName string    `json:"projectName"` // decoded path
    FilePath    string    `json:"filePath"`    // full path to .jsonl
    ModTime     time.Time `json:"modTime"`
    SizeBytes   int64     `json:"sizeBytes"`
}
```

## JSONL Parsing

**File**: `internal/session/parser.go`

`ParseFile()` reads a JSONL file line by line, deserializes each line into a `Record`, then merges records into display-ready `Message` objects.

### Record Structure

Each line in the JSONL file is one `Record` (`types.go:9-22`):

```go
type Record struct {
    Type          string          `json:"type"`
    UUID          string          `json:"uuid"`
    SessionID     string          `json:"sessionId"`
    Timestamp     time.Time       `json:"timestamp"`
    Message       RawMessage      `json:"message"`
    IsMeta        bool            `json:"isMeta"`
    IsSidechain   bool            `json:"isSidechain"`
    ToolUseResult json.RawMessage `json:"toolUseResult,omitempty"`
    // ...
}
```

The `Message` field contains the actual conversation data:

```go
type RawMessage struct {
    Role    string          `json:"role"`    // "user" or "assistant"
    ID      string          `json:"id"`      // message ID (for merging)
    Content json.RawMessage `json:"content"` // polymorphic!
}
```

### The Polymorphic `content` Field

The most non-obvious part of parsing is that `content` can be two different types depending on the record. The parser (`parser.go:124-178`) must handle both:

**User records** -- `content` is either a plain string or a `[]ContentBlock` array:

```go
// parseUserRecord (parser.go:117-180)
func parseUserRecord(rec *Record) *Message {
    content := rec.Message.Content

    // Try as string first
    var textContent string
    if err := json.Unmarshal(content, &textContent); err == nil {
        msg.TextContent = textContent
        return msg
    }

    // Try as array of content blocks (tool results)
    var blocks []ContentBlock
    if err := json.Unmarshal(content, &blocks); err == nil {
        // extract tool_result blocks...
    }
}
```

- When the user types a message, `content` is `"some text"` (a JSON string).
- When the user record carries tool results, `content` is `[{"type": "tool_result", ...}]` (a JSON array).

**Assistant records** -- `content` is always a `[]ContentBlock` array, but the same try-both pattern is used in `parseContentBlocks()` (`parser.go:183-198`) for safety:

```go
func parseContentBlocks(raw json.RawMessage) []ContentBlock {
    var blocks []ContentBlock
    if err := json.Unmarshal(raw, &blocks); err != nil {
        // Fallback: try as string
        var text string
        if err := json.Unmarshal(raw, &text); err == nil && text != "" {
            return []ContentBlock{{Type: "text", Text: text}}
        }
        return nil
    }
    return blocks
}
```

Using `json.RawMessage` for the `Content` field defers deserialization, letting the parser attempt each format in turn without knowing the type upfront.

### Filtering

Before merging, the parser skips non-renderable records (`parser.go:47-59`):

- Records with `type` = `"file-history-snapshot"` or `"progress"`
- Records where `isMeta` is true
- Records with an empty `message.role`

Command/system messages from the user are also filtered out:

```go
if strings.HasPrefix(textContent, "<local-command") ||
    strings.HasPrefix(textContent, "<command-name>") {
    return nil
}
```

## Record Merging

**File**: `internal/session/parser.go`, function `mergeRecords()` (line 63)

Claude streams assistant responses as multiple JSONL records that share the same `message.id`. For example, a single assistant turn might produce three records: one with a `thinking` block, one with a `text` block, and one with a `tool_use` block. The parser must combine these into a single logical message.

```go
func mergeRecords(records []Record) []Message {
    var messages []Message
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
            msgID := rec.Message.ID

            if idx, ok := assistantMessages[msgID]; ok {
                // Merge: append blocks to existing message
                messages[idx].Blocks = append(messages[idx].Blocks, blocks...)
            } else {
                // New message: track its index
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
```

The map `assistantMessages` tracks message ID to its position in the output slice. When a duplicate ID is encountered, the new content blocks are appended to the existing message. User records are never merged -- each record becomes its own message.

The final output is a `ParsedSession`:

```go
type ParsedSession struct {
    Info     SessionInfo `json:"info"`
    Messages []Message   `json:"messages"`
}
```

Where each `Message` looks like:

```go
type Message struct {
    ID          string         `json:"id"`
    Role        string         `json:"role"`
    Timestamp   time.Time      `json:"timestamp"`
    Blocks      []ContentBlock `json:"blocks"`          // assistant content blocks
    TextContent string         `json:"textContent"`     // user text messages
    ToolResults []ToolResult   `json:"toolResults"`     // user tool result messages
}
```

## API Layer

**Files**: `internal/api/server.go`, `internal/api/handlers_session.go`

The Go server uses Go 1.22+ `http.ServeMux` with method routing (`server.go:32-51`):

```go
func (s *Server) registerRoutes() {
    s.mux.HandleFunc("GET /api/sessions",       s.handleListSessions)
    s.mux.HandleFunc("GET /api/sessions/{id}",  s.handleGetSession)
    // ... manifest and export routes ...
}
```

### GET /api/sessions

`handleListSessions` (`handlers_session.go:12-27`) calls `session.DiscoverSessions()`, sorts results by modification time (newest first), and returns JSON:

```json
[
  {
    "id": "abc123",
    "projectDir": "D--repos-claude-chronicle",
    "projectName": "D:/repos/claude-chronicle",
    "filePath": "C:\\Users\\...\\abc123.jsonl",
    "modTime": "2026-02-07T10:30:00Z",
    "sizeBytes": 524288
  }
]
```

### GET /api/sessions/{id}

`handleGetSession` (`handlers_session.go:29-58`) does three things:
1. Calls `session.FindSession(id)` to locate the JSONL file
2. Calls `session.ParseFile(info.FilePath)` to parse and merge records
3. Attaches the `SessionInfo` to the result and returns it as JSON

The returned `ParsedSession` JSON contains the full `info` object plus the `messages` array with all merged, display-ready messages.

### SPA Fallback

For non-API routes, the server serves the embedded SPA from `web/dist/` (`server.go:58-83`). If the requested path does not match a static file, it falls back to `index.html` for client-side routing. In dev mode, non-API requests are redirected to the Vite dev server instead (`server.go:86-94`).

## SPA Rendering Path

**Entry point**: `web/src/main.tsx` -> `App.tsx`

### Data Fetching

The SPA uses React hooks to fetch data from the API:

1. **`useSessionList`** (`session/useSessionList.ts`): On mount, calls `GET /api/sessions` via `fetchSessions()` and stores the list in state.

2. **`useSessionData`** (`session/useSessionData.ts`): When a session is selected, calls `GET /api/sessions/{id}` via `fetchSession()`.

3. **`useManifest`** (`manifest/useManifest.ts`): Fetches the manifest for the selected session via `GET /api/sessions/{id}/manifest`.

The API client modules (`session/api.ts` and `manifest/api.ts`) wrap `fetch()` calls to all endpoints.

### Component Tree

```
App
 +-- Toolbar (theme selector, export button)
 +-- SessionList (sidebar with all sessions)
 +-- SessionViewer
      +-- applyManifest() via useMemo
      +-- MessageBlock (for each message)
      |    +-- AssistantBlock (text / thinking / tool_use)
      |    +-- UserContent (text / tool results)
      +-- CollapsedGroup (for collapsed message groups)
      +-- AnnotationBlock (for inserted annotations)
      +-- EditControls (shown in edit mode)
```

### Message Rendering

Theme message blocks (`themes/claude/ClaudeMessageBlock.tsx` and `themes/copilot/CopilotMessageBlock.tsx`) dispatch on message role and block type:

**Assistant messages** iterate over `blocks[]` and render each by type:

| Block type   | Component        | Description                    |
|-------------|------------------|--------------------------------|
| `text`      | `MarkdownContent`| Rendered as markdown           |
| `thinking`  | `ThinkingBlock`  | Collapsible thinking content   |
| `tool_use`  | `ToolUseBlock`   | Tool name, ID, and input       |
| (unknown)   | `null`           | Silently ignored               |

**User messages** have two shapes:
- `textContent` (string) -> rendered as markdown via `MarkdownContent`
- `toolResults[]` -> rendered by `ToolResultDisplay`, which dispatches on the `result.type` field to show stdout/stderr, file changes, glob results, etc.

## Manifest System

The manifest is a non-destructive edit layer that allows curating sessions without modifying the original JSONL files.

### Storage

**Files**: `internal/manifest/types.go`, `internal/manifest/storage.go`

Manifests are stored as JSON files in `~/.claude-chronicle/manifests/{session-id}.json`. The Go backend never modifies `~/.claude/` -- all Chronicle data lives separately.

```go
type Manifest struct {
    Version   int    `json:"version"`
    SessionID string `json:"sessionId"`
    Edits     []Edit `json:"edits"`
}

type Edit struct {
    Type         string   `json:"type"`
    BlockID      string   `json:"blockId,omitempty"`
    BlockIDs     []string `json:"blockIds,omitempty"`
    Summary      string   `json:"summary,omitempty"`
    AfterBlockID string   `json:"afterBlockId,omitempty"`
    Content      string   `json:"content,omitempty"`
    ID           string   `json:"id,omitempty"`
    NewContent   string   `json:"newContent,omitempty"`
}
```

### Edit Types

| Type       | Effect                                             |
|------------|---------------------------------------------------|
| `delete`   | Remove a message by `blockId`                      |
| `collapse` | Group multiple messages (`blockIds`) into a summary |
| `annotate` | Insert commentary text after a message              |
| `editText` | Replace a message's text content                    |
| `reorder`  | Move a message to after another message             |

### Client-Side Application

**File**: `web/src/manifest/sessionTransform.ts`

Manifest edits are applied entirely in the browser -- the Go backend stores and serves manifests but does not apply them. The `applyManifest()` function (`sessionTransform.ts:12-103`) processes the edit array sequentially, building lookup maps, then transforms the message list in a single pass:

```
Input: Message[] + EditManifest
                |
  1. Build lookup maps from edits:
     - deleted: Set<blockId>
     - collapsed: Map<blockId, summary>
     - annotations: Map<afterBlockId, annotation[]>
     - textEdits: Map<blockId, newContent>
                |
  2. Iterate messages:
     - Skip deleted messages
     - Replace collapsed groups with summary
     - Apply text edits
     - Insert annotations after their target
                |
Output: TransformedMessage[]
```

**Order matters**: edits in the manifest array are applied sequentially when building the lookup maps. If an earlier edit deletes a block that a later collapse references, the collapse will not find that block. The sequential processing of edits means the manifest array order defines the final result.

The same `applyManifest()` function runs in both the SPA and export contexts -- `SessionViewer` calls it via `useMemo` in both cases.

### API Endpoints

The manifest API (`internal/api/handlers_manifest.go`) supports CRUD operations:

```
GET    /api/sessions/{id}/manifest          -> Load (or return empty)
PUT    /api/sessions/{id}/manifest          -> Replace entire manifest
POST   /api/sessions/{id}/manifest/edits    -> Append one edit
DELETE /api/sessions/{id}/manifest/edits/{i} -> Remove edit by index
```

## Export Path

The export path produces a single self-contained HTML file with all session data embedded.

### Build-Time: Export Template

**Config**: `web/vite.config.export.ts`
**Entry HTML**: `web/export.html`
**Entry script**: `web/src/export-main.tsx`

The export template is built by Vite with `vite-plugin-singlefile`, which inlines all JavaScript, CSS, and assets into a single HTML file. The entry HTML contains the critical placeholder:

```html
<script>window.__CHRONICLE_DATA__={};</script>
```

The built template lands in `web/dist-export/export.html` and is embedded into the Go binary via `embed.go`:

```go
//go:embed web/dist-export/export.html
var ExportTemplate []byte
```

### Run-Time: Export Engine

**File**: `internal/export/engine.go`

When an export is requested (via CLI or API), the engine:

1. Parses the session JSONL (same as the API path)
2. Loads the manifest (if any)
3. Bundles both into an `ExportData` struct
4. Injects the JSON into the template via string replacement

```go
func GenerateHTML(template []byte, data *ExportData) ([]byte, error) {
    jsonData, _ := json.Marshal(data)
    html := string(template)

    // Replace the placeholder with actual data
    html = strings.Replace(
        html,
        "window.__CHRONICLE_DATA__={}",
        "window.__CHRONICLE_DATA__="+string(jsonData),
        1,
    )

    // Set the theme attribute
    html = strings.Replace(
        html,
        `data-theme="claude"`,
        fmt.Sprintf(`data-theme="%s"`, data.Theme),
        1,
    )
    return []byte(html), nil
}
```

The `ExportData` struct carries everything the frontend needs:

```go
type ExportData struct {
    Session  *session.ParsedSession `json:"session"`
    Manifest *manifest.Manifest     `json:"manifest"`
    Theme    string                 `json:"theme"`
}
```

### Client-Side: Export Rendering

**File**: `web/src/export-main.tsx`

When the exported HTML opens in a browser, `export-main.tsx` reads the injected data from `window.__CHRONICLE_DATA__` and passes it to `ExportViewer`:

```tsx
const data = window.__CHRONICLE_DATA__;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExportViewer data={data} />
  </StrictMode>,
);
```

`ExportViewer` (`export/ExportViewer.tsx`) casts the data to the expected shape and renders the same `SessionViewer` component used by the SPA, with edit mode disabled:

```tsx
export function ExportViewer({ data }: Props) {
  const exportData = data as ExportData;
  return (
    <SessionViewer
      session={exportData.session}
      manifest={exportData.manifest}
    />
  );
}
```

The export handler in the API (`internal/api/handlers_export.go`) orchestrates this for the `POST /api/sessions/{id}/export` endpoint, while the CLI `export` command does the same thing directly.

## SPA vs Export: Side-by-Side Comparison

| Aspect                  | SPA Path                                      | Export Path                                     |
|-------------------------|-----------------------------------------------|-------------------------------------------------|
| **Entry point**         | `web/src/main.tsx`                            | `web/src/export-main.tsx`                       |
| **Data source**         | `fetch("/api/sessions/{id}")` over HTTP       | `window.__CHRONICLE_DATA__` (embedded in HTML)  |
| **Vite config**         | `vite.config.ts` -> `web/dist/`               | `vite.config.export.ts` -> `web/dist-export/`   |
| **Manifest source**     | `fetch("/api/sessions/{id}/manifest")`        | Included in `__CHRONICLE_DATA__.manifest`        |
| **Manifest application**| `sessionTransform.ts` (client-side)           | `sessionTransform.ts` (same code, client-side)  |
| **Rendering component** | `SessionViewer` (with edit controls)          | `SessionViewer` (read-only, edit mode disabled) |
| **Edit mode**           | Supported (add/remove edits via API)          | Disabled (static output)                        |
| **Output format**       | Served by Go HTTP server                      | Single self-contained `.html` file              |
| **Embedding**           | `embed.go`: `web/dist/*` -> `WebDistFS`       | `embed.go`: `web/dist-export/export.html` -> `ExportTemplate` |
| **Theme**               | User-selectable at runtime                    | Fixed at export time via `data-theme` attribute |

### Shared Pipeline

Both paths share these stages identically:

1. **JSONL parsing** -- `internal/session/parser.go` (same Go code)
2. **Record merging** -- `mergeRecords()` combines streamed assistant records
3. **Manifest transform** -- `web/src/manifest/sessionTransform.ts` (same JS, runs in browser)
4. **Message rendering** -- `SessionViewer` -> `MessageBlock` -> component tree

The only divergence is how the parsed data reaches the browser: HTTP API response vs. inline JSON in the HTML.
