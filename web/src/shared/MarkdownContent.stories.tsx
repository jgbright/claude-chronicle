import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownContent } from './MarkdownContent';

const meta = {
  component: MarkdownContent,
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Headings: Story = {
  args: {
    content: `# Heading 1

## Heading 2

### Heading 3

#### Heading 4

Some body text after the headings.`,
  },
};

export const CodeFences: Story = {
  args: {
    content: `Here is a TypeScript function:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

And some inline code: \`const x = 42;\` in a sentence.

\`\`\`go
func main() {
    fmt.Println("Hello from Go")
}
\`\`\``,
  },
};

export const Tables: Story = {
  args: {
    content: `| Command | Description | Default |
|---------|-------------|---------|
| \`serve\` | Start the web server | Port 8080 |
| \`list\` | List discovered sessions | - |
| \`export\` | Export session to HTML | stdout |
| \`version\` | Print version info | - |`,
  },
};

export const Lists: Story = {
  args: {
    content: `**Unordered list:**

- Session discovery and parsing
- Manifest system for non-destructive edits
- API server with SPA fallback
- Export engine for single-file HTML

**Ordered list:**

1. Parse the JSONL file
2. Apply manifest edits
3. Inject data into template
4. Write the output HTML`,
  },
};

export const Links: Story = {
  args: {
    content: `Check out [Claude Chronicle](https://github.com/jgbright/claude-chronicle) on GitHub.

Related links:
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)
- [Issue Tracker](https://github.com/jgbright/claude-chronicle/issues)`,
  },
};

export const Blockquote: Story = {
  args: {
    content: `> **Note:** This is an important callout that users should pay attention to.
> It can span multiple lines and contain **bold** or *italic* text.

Regular paragraph after the blockquote.

> Another blockquote with \`inline code\` inside it.`,
  },
};

export const GFMMix: Story = {
  args: {
    content: `# Session Export Guide

Export your Claude Code sessions as **single-file HTML** documents.

## Quick Start

1. Run the export command:

\`\`\`bash
chronicle export -session abc-123 -o session.html
\`\`\`

2. Open the generated file in your browser.

## Supported Themes

| Theme | Description |
|-------|-------------|
| Claude | Default purple theme |
| Copilot | Dark GitHub-style theme |

> **Tip:** Use \`-theme copilot\` for dark mode exports.

### Features

- Syntax-highlighted code blocks
- Collapsible tool use sections
- [GFM tables](https://github.github.com/gfm/#tables-extension-) support
- Inline \`code\` rendering`,
  },
};
