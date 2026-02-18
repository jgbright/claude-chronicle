import{C as i}from"./CodeBlock-BmWUxHCS.js";import"./jsx-runtime-u17CrQMm.js";import"./iframe-CJQASDKF.js";import"./preload-helper-PPVm8Dsz.js";const u={component:i},e={args:{code:`interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
}

function parseSession(raw: string): Session {
  const data = JSON.parse(raw);
  return { ...data, createdAt: new Date(data.createdAt) };
}`,language:"typescript"}},r={args:{code:`func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    session, err := s.store.Get(id)
    if err != nil {
        http.Error(w, "session not found", http.StatusNotFound)
        return
    }
    w.Header().Set("Content-Type", "text/html")
    s.exporter.Write(w, session)
}`,language:"go"}},s={args:{code:`def process_sessions(directory: str) -> list[dict]:
    sessions = []
    for path in Path(directory).glob("*.jsonl"):
        with open(path) as f:
            records = [json.loads(line) for line in f]
        sessions.append({"file": path.name, "records": records})
    return sessions`,language:"python"}},n={args:{code:`{
  "id": "abc-123",
  "type": "human",
  "message": {
    "content": "Hello, world!",
    "model": "claude-sonnet-4-5-20250929"
  }
}`,language:"json"}},o={args:{code:`#!/bin/bash
set -euo pipefail

echo "Building web assets..."
cd web && npm run build
cd ..

echo "Building Go binary..."
go build -ldflags "-X main.version=$VERSION" -o chronicle ./cmd/chronicle`,language:"bash"}},a={args:{code:`--- a/internal/session/parser.go
+++ b/internal/session/parser.go
@@ -42,7 +42,9 @@
 func parseContent(raw json.RawMessage) ([]ContentBlock, error) {
-    var blocks []ContentBlock
-    if err := json.Unmarshal(raw, &blocks); err != nil {
+    var blocks []ContentBlock
+    if err := json.Unmarshal(raw, &blocks); err != nil {
+        // content might be a plain string
         var s string
         if err2 := json.Unmarshal(raw, &s); err2 != nil {`,language:"diff"}},t={args:{code:`Error: ENOENT: no such file or directory, open '/home/user/.claude/projects/missing/session.jsonl'
    at Object.openSync (node:fs:603:3)
    at readFileSync (node:fs:471:35)
    at parseSession (/src/lib/parser.ts:12:18)`,isError:!0}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
}

function parseSession(raw: string): Session {
  const data = JSON.parse(raw);
  return { ...data, createdAt: new Date(data.createdAt) };
}\`,
    language: 'typescript'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    session, err := s.store.Get(id)
    if err != nil {
        http.Error(w, "session not found", http.StatusNotFound)
        return
    }
    w.Header().Set("Content-Type", "text/html")
    s.exporter.Write(w, session)
}\`,
    language: 'go'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`def process_sessions(directory: str) -> list[dict]:
    sessions = []
    for path in Path(directory).glob("*.jsonl"):
        with open(path) as f:
            records = [json.loads(line) for line in f]
        sessions.append({"file": path.name, "records": records})
    return sessions\`,
    language: 'python'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`{
  "id": "abc-123",
  "type": "human",
  "message": {
    "content": "Hello, world!",
    "model": "claude-sonnet-4-5-20250929"
  }
}\`,
    language: 'json'
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`#!/bin/bash
set -euo pipefail

echo "Building web assets..."
cd web && npm run build
cd ..

echo "Building Go binary..."
go build -ldflags "-X main.version=$VERSION" -o chronicle ./cmd/chronicle\`,
    language: 'bash'
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`--- a/internal/session/parser.go
+++ b/internal/session/parser.go
@@ -42,7 +42,9 @@
 func parseContent(raw json.RawMessage) ([]ContentBlock, error) {
-    var blocks []ContentBlock
-    if err := json.Unmarshal(raw, &blocks); err != nil {
+    var blocks []ContentBlock
+    if err := json.Unmarshal(raw, &blocks); err != nil {
+        // content might be a plain string
         var s string
         if err2 := json.Unmarshal(raw, &s); err2 != nil {\`,
    language: 'diff'
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    code: \`Error: ENOENT: no such file or directory, open '/home/user/.claude/projects/missing/session.jsonl'
    at Object.openSync (node:fs:603:3)
    at readFileSync (node:fs:471:35)
    at parseSession (/src/lib/parser.ts:12:18)\`,
    isError: true
  }
}`,...t.parameters?.docs?.source}}};const g=["TypeScript","Go","Python","JSON","Bash","Diff","ErrorOutput"];export{o as Bash,a as Diff,t as ErrorOutput,r as Go,n as JSON,s as Python,e as TypeScript,g as __namedExportsOrder,u as default};
