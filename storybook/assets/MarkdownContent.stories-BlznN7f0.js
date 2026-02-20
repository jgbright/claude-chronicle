import{M as a}from"./MarkdownContent-DohGiVjL.js";import"./jsx-runtime-u17CrQMm.js";import"./CodeBlock-Dwn0PIi1.js";import"./iframe-CD0i-AUq.js";import"./preload-helper-PPVm8Dsz.js";const m={component:a},e={args:{content:`# Heading 1

## Heading 2

### Heading 3

#### Heading 4

Some body text after the headings.`}},n={args:{content:'Here is a TypeScript function:\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n```\n\nAnd some inline code: `const x = 42;` in a sentence.\n\n```go\nfunc main() {\n    fmt.Println("Hello from Go")\n}\n```'}},t={args:{content:"| Command | Description | Default |\n|---------|-------------|---------|\n| `serve` | Start the web server | Port 8080 |\n| `list` | List discovered sessions | - |\n| `export` | Export session to HTML | stdout |\n| `version` | Print version info | - |"}},s={args:{content:`**Unordered list:**

- Session discovery and parsing
- Manifest system for non-destructive edits
- API server with SPA fallback
- Export engine for single-file HTML

**Ordered list:**

1. Parse the JSONL file
2. Apply manifest edits
3. Inject data into template
4. Write the output HTML`}},o={args:{content:`Check out [Claude Chronicle](https://github.com/jgbright/claude-chronicle) on GitHub.

Related links:
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)
- [Issue Tracker](https://github.com/jgbright/claude-chronicle/issues)`}},r={args:{content:`> **Note:** This is an important callout that users should pay attention to.
> It can span multiple lines and contain **bold** or *italic* text.

Regular paragraph after the blockquote.

> Another blockquote with \`inline code\` inside it.`}},i={args:{content:`# Session Export Guide

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
- Inline \`code\` rendering`}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`# Heading 1

## Heading 2

### Heading 3

#### Heading 4

Some body text after the headings.\`
  }
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:'{\n  args: {\n    content: `Here is a TypeScript function:\n\n\\`\\`\\`typescript\nfunction greet(name: string): string {\n  return \\`Hello, \\${name}!\\`;\n}\n\\`\\`\\`\n\nAnd some inline code: \\`const x = 42;\\` in a sentence.\n\n\\`\\`\\`go\nfunc main() {\n    fmt.Println("Hello from Go")\n}\n\\`\\`\\``\n  }\n}',...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{\n  args: {\n    content: `| Command | Description | Default |\n|---------|-------------|---------|\n| \\`serve\\` | Start the web server | Port 8080 |\n| \\`list\\` | List discovered sessions | - |\n| \\`export\\` | Export session to HTML | stdout |\n| \\`version\\` | Print version info | - |`\n  }\n}",...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`**Unordered list:**

- Session discovery and parsing
- Manifest system for non-destructive edits
- API server with SPA fallback
- Export engine for single-file HTML

**Ordered list:**

1. Parse the JSONL file
2. Apply manifest edits
3. Inject data into template
4. Write the output HTML\`
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`Check out [Claude Chronicle](https://github.com/jgbright/claude-chronicle) on GitHub.

Related links:
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)
- [Issue Tracker](https://github.com/jgbright/claude-chronicle/issues)\`
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`> **Note:** This is an important callout that users should pay attention to.
> It can span multiple lines and contain **bold** or *italic* text.

Regular paragraph after the blockquote.

> Another blockquote with \\\`inline code\\\` inside it.\`
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    content: \`# Session Export Guide

Export your Claude Code sessions as **single-file HTML** documents.

## Quick Start

1. Run the export command:

\\\`\\\`\\\`bash
chronicle export -session abc-123 -o session.html
\\\`\\\`\\\`

2. Open the generated file in your browser.

## Supported Themes

| Theme | Description |
|-------|-------------|
| Claude | Default purple theme |
| Copilot | Dark GitHub-style theme |

> **Tip:** Use \\\`-theme copilot\\\` for dark mode exports.

### Features

- Syntax-highlighted code blocks
- Collapsible tool use sections
- [GFM tables](https://github.github.com/gfm/#tables-extension-) support
- Inline \\\`code\\\` rendering\`
  }
}`,...i.parameters?.docs?.source}}};const h=["Headings","CodeFences","Tables","Lists","Links","Blockquote","GFMMix"];export{r as Blockquote,n as CodeFences,i as GFMMix,e as Headings,o as Links,s as Lists,t as Tables,h as __namedExportsOrder,m as default};
