import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SessionViewer } from './SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { claudeComponents } from '../themes/claude/components';
import {
  createParsedSession,
  createSessionInfo,
  createManifest,
  createMessage,
  createUserMessage,
  createContentBlock,
  createToolResult,
  createToolUseResultData,
  createDeleteEdit,
  createAnnotateEdit,
} from '../test/factories';

const meta = {
  component: SessionViewer,
  parameters: { theme: 'claude' },
  decorators: [
    (Story) => (
      <ThemeComponentProvider value={claudeComponents}>
        <Story />
      </ThemeComponentProvider>
    ),
  ],
} satisfies Meta<typeof SessionViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  onAddEdit: fn(),
  onRemoveEdit: fn(),
  onUndo: fn(),
  onRedo: fn(),
  onUpdateTitle: fn(),
  onToast: fn(),
  canUndo: false,
  canRedo: false,
};

export const Default: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession(),
    manifest: null,
  },
};

export const WithDeletedItems: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Can you help me?' }),
        createMessage({ id: 'a1', blocks: [createContentBlock({ text: 'Sure, let me look.' })] }),
        createMessage({ id: 'a2', blocks: [createContentBlock({ text: 'Here is my analysis.' })] }),
      ],
    }),
    manifest: createManifest({
      edits: [createDeleteEdit('a1')],
    }),
    showDeleted: true,
    canUndo: true,
  },
};

export const WithAnnotations: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Hello!' }),
        createMessage({ id: 'a1', blocks: [createContentBlock({ text: 'Hi there!' })] }),
      ],
    }),
    manifest: createManifest({
      edits: [createAnnotateEdit('u1', 'This is a great question', 'ann-1')],
    }),
  },
};

export const WithThinkingBlocks: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Explain quantum computing.' }),
        createMessage({
          id: 'a1',
          blocks: [
            createContentBlock({ type: 'thinking', thinking: 'The user wants a clear explanation. I should break this down into simple concepts: qubits, superposition, entanglement, and practical applications.' }),
            createContentBlock({ type: 'text', text: 'Quantum computing uses qubits that can exist in superposition, allowing parallel processing of multiple states simultaneously.' }),
          ],
        }),
        createUserMessage({ id: 'u2', textContent: 'What about entanglement?' }),
        createMessage({
          id: 'a2',
          blocks: [
            createContentBlock({ type: 'thinking', thinking: 'Now covering entanglement. I need to explain how measuring one qubit affects its entangled partner.' }),
            createContentBlock({ type: 'text', text: 'Entanglement is a correlation between qubits where the state of one instantly determines the state of another, regardless of distance.' }),
          ],
        }),
      ],
    }),
    manifest: null,
  },
};

export const ToolResultSession: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Read and fix the config file.' }),
        createMessage({
          id: 'a1',
          blocks: [
            createContentBlock({ type: 'text', text: 'Let me read the file first.' }),
            createContentBlock({ type: 'tool_use', name: 'Read', id: 'tool-1', input: { file_path: 'config.json' } }),
          ],
        }),
        createUserMessage({
          id: 'tr1',
          textContent: undefined,
          toolResults: [createToolResult({ toolUseId: 'tool-1', content: '{ "port": 3000, "debug": true }' })],
        }),
        createMessage({
          id: 'a2',
          blocks: [
            createContentBlock({ type: 'text', text: 'I see the issue. Let me fix it.' }),
            createContentBlock({ type: 'tool_use', name: 'Edit', id: 'tool-2', input: { file_path: 'config.json', old_string: '"debug": true', new_string: '"debug": false' } }),
          ],
        }),
        createUserMessage({
          id: 'tr2',
          textContent: undefined,
          toolResults: [createToolResult({
            toolUseId: 'tool-2',
            content: '',
            result: createToolUseResultData({ type: 'update', filePath: 'config.json' }),
          })],
        }),
        createMessage({
          id: 'a3',
          blocks: [createContentBlock({ type: 'text', text: 'Done! Debug mode is now disabled.' })],
        }),
      ],
    }),
    manifest: null,
  },
};

export const FullEditingSession: Story = {
  args: {
    ...defaultArgs,
    session: createParsedSession({
      info: createSessionInfo({ title: 'Refactoring auth module' }),
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Refactor the auth module to use JWT.' }),
        createMessage({
          id: 'a1',
          blocks: [
            createContentBlock({ type: 'thinking', thinking: 'I need to identify the current auth implementation, design the JWT flow, and update the relevant files.' }),
            createContentBlock({ type: 'text', text: 'I\'ll start by reading the current auth implementation.' }),
            createContentBlock({ type: 'tool_use', name: 'Read', id: 'tool-1', input: { file_path: 'src/auth.ts' } }),
          ],
        }),
        createUserMessage({
          id: 'tr1',
          textContent: undefined,
          toolResults: [createToolResult({ toolUseId: 'tool-1', content: 'export function authenticate(user, pass) { ... }' })],
        }),
        createMessage({
          id: 'a2',
          blocks: [
            createContentBlock({ type: 'thinking', thinking: 'The current implementation uses session-based auth. I\'ll convert to JWT with proper token signing.' }),
            createContentBlock({ type: 'text', text: 'I\'ll now update the auth module to use JWT tokens.' }),
            createContentBlock({ type: 'tool_use', name: 'Edit', id: 'tool-2', input: { file_path: 'src/auth.ts', old_string: 'session-based', new_string: 'jwt-based' } }),
          ],
        }),
        createUserMessage({
          id: 'tr2',
          textContent: undefined,
          toolResults: [createToolResult({
            toolUseId: 'tool-2',
            content: '',
            result: createToolUseResultData({ type: 'update', filePath: 'src/auth.ts' }),
          })],
        }),
        createMessage({
          id: 'a3',
          blocks: [createContentBlock({ type: 'text', text: 'The auth module has been updated to use JWT. Let me run the tests.' })],
        }),
        createMessage({
          id: 'a4',
          blocks: [
            createContentBlock({ type: 'tool_use', name: 'Bash', id: 'tool-3', input: { command: 'npm test' } }),
          ],
        }),
        createUserMessage({
          id: 'tr3',
          textContent: undefined,
          toolResults: [createToolResult({ toolUseId: 'tool-3', result: { stdout: 'All 42 tests passed.', stderr: '' } })],
        }),
        createMessage({
          id: 'a5',
          blocks: [createContentBlock({ type: 'text', text: 'All tests pass. The refactoring is complete.' })],
        }),
      ],
    }),
    manifest: createManifest({
      edits: [
        createDeleteEdit('a4'),
        createAnnotateEdit('a3', 'This is the key change that converts session auth to JWT.', 'ann-1'),
      ],
    }),
    canUndo: true,
    canRedo: false,
  },
};
