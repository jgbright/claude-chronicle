import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from './CodeBlock';

const meta = {
  component: CodeBlock,
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScript: Story = {
  args: {
    code: `interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
}

function parseSession(raw: string): Session {
  const data = JSON.parse(raw);
  return { ...data, createdAt: new Date(data.createdAt) };
}`,
    language: 'typescript',
  },
};

export const Go: Story = {
  args: {
    code: `func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	session, err := s.store.Get(id)
	if err != nil {
		http.Error(w, "session not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "text/html")
	s.exporter.Write(w, session)
}`,
    language: 'go',
  },
};

export const Python: Story = {
  args: {
    code: `def process_sessions(directory: str) -> list[dict]:
    sessions = []
    for path in Path(directory).glob("*.jsonl"):
        with open(path) as f:
            records = [json.loads(line) for line in f]
        sessions.append({"file": path.name, "records": records})
    return sessions`,
    language: 'python',
  },
};

export const JSON: Story = {
  args: {
    code: `{
  "id": "abc-123",
  "type": "human",
  "message": {
    "content": "Hello, world!",
    "model": "claude-sonnet-4-5-20250929"
  }
}`,
    language: 'json',
  },
};

export const Bash: Story = {
  args: {
    code: `#!/bin/bash
set -euo pipefail

echo "Building web assets..."
cd web && npm run build
cd ..

echo "Building Go binary..."
go build -ldflags "-X main.version=$VERSION" -o chronicle ./cmd/chronicle`,
    language: 'bash',
  },
};

export const Diff: Story = {
  args: {
    code: `--- a/internal/session/parser.go
+++ b/internal/session/parser.go
@@ -42,7 +42,9 @@
 func parseContent(raw json.RawMessage) ([]ContentBlock, error) {
-    var blocks []ContentBlock
-    if err := json.Unmarshal(raw, &blocks); err != nil {
+    var blocks []ContentBlock
+    if err := json.Unmarshal(raw, &blocks); err != nil {
+        // content might be a plain string
         var s string
         if err2 := json.Unmarshal(raw, &s); err2 != nil {`,
    language: 'diff',
  },
};

export const ErrorOutput: Story = {
  args: {
    code: `Error: ENOENT: no such file or directory, open '/home/user/.claude/projects/missing/session.jsonl'
    at Object.openSync (node:fs:603:3)
    at readFileSync (node:fs:471:35)
    at parseSession (/src/lib/parser.ts:12:18)`,
    isError: true,
  },
};
