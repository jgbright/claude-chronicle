import type { Meta, StoryObj } from '@storybook/react';
import { ToolUseBlock } from './ToolUseBlock';

const meta = {
  component: ToolUseBlock,
} satisfies Meta<typeof ToolUseBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BashCommand: Story = {
  args: {
    toolName: 'Bash',
    toolId: 'tool_01ABC',
    input: {
      command: 'go test ./internal/session/ -v -count=1',
    },
  },
};

export const ReadFile: Story = {
  args: {
    toolName: 'Read',
    toolId: 'tool_02DEF',
    input: {
      file_path: '/home/user/repos/claude-chronicle/internal/session/parser.go',
    },
  },
};

export const WriteFile: Story = {
  args: {
    toolName: 'Write',
    toolId: 'tool_03GHI',
    input: {
      file_path: '/home/user/repos/claude-chronicle/web/src/App.tsx',
      content: `import { BrowserRouter } from 'react-router-dom';
import { SessionList } from './pages/SessionList';

export function App() {
  return (
    <BrowserRouter>
      <SessionList />
    </BrowserRouter>
  );
}`,
    },
  },
};

export const EditFile: Story = {
  args: {
    toolName: 'Edit',
    toolId: 'tool_04JKL',
    input: {
      file_path: '/home/user/repos/claude-chronicle/internal/api/server.go',
      old_string: 'mux.HandleFunc("GET /api/sessions", s.listSessions)',
      new_string: `mux.HandleFunc("GET /api/sessions", s.listSessions)
mux.HandleFunc("GET /api/sessions/{id}/manifest", s.getManifest)`,
    },
  },
};

export const GlobSearch: Story = {
  args: {
    toolName: 'Glob',
    toolId: 'tool_05MNO',
    input: {
      pattern: '**/*.test.{ts,tsx}',
    },
  },
};

export const GrepSearch: Story = {
  args: {
    toolName: 'Grep',
    toolId: 'tool_06PQR',
    input: {
      pattern: 'func.*handleExport',
      path: '/home/user/repos/claude-chronicle/internal/',
      glob: '*.go',
    },
  },
};
