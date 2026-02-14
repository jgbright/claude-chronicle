import type { Meta, StoryObj } from '@storybook/react';
import { ClaudeMessageBlock } from './ClaudeMessageBlock';
import { BulkCollapseProvider } from '../../session/BulkCollapseContext';
import { createMessage, createUserMessage, createContentBlock, createToolResult, createToolUseResultData } from '../../test/factories';

const meta = {
  component: ClaudeMessageBlock,
  parameters: { theme: 'claude' },
} satisfies Meta<typeof ClaudeMessageBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    message: createUserMessage({ textContent: 'Can you help me refactor this function?' }),
  },
};

export const AssistantText: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({ type: 'text', text: 'Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements.' }),
      ],
    }),
  },
};

export const WithThinking: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({ type: 'thinking', thinking: 'The user wants to refactor a function. I should consider readability, performance, and maintainability. Let me analyze the current structure and suggest improvements that follow best practices.' }),
        createContentBlock({ type: 'text', text: 'I have analyzed the function. Here are my suggested improvements.' }),
      ],
    }),
  },
};

export const WithToolUse: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'tool_use',
          name: 'Read',
          id: 'tool-1',
          input: { file_path: '/src/utils/helpers.ts' },
        }),
      ],
    }),
  },
};

export const ToolUseBash: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'tool_use',
          name: 'Bash',
          id: 'tool-bash',
          input: { command: 'npm test' },
        }),
      ],
    }),
  },
};

export const ToolUseEdit: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'tool_use',
          name: 'Edit',
          id: 'tool-edit',
          input: { file_path: 'web/src/themes/claude/claude.css', old_string: 'padding: 12px 16px;', new_string: 'padding: 4px 12px;' },
        }),
      ],
    }),
  },
};

export const ToolUseSearch: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'tool_use',
          name: 'Grep',
          id: 'tool-grep',
          input: { pattern: 'ClaudeMessageBlock', path: 'web/src/', glob: '*.tsx' },
        }),
      ],
    }),
  },
};

export const MultipleToolCalls: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({ type: 'text', text: 'Let me read those files and make the changes.' }),
        createContentBlock({
          type: 'tool_use',
          name: 'Read',
          id: 'tool-r1',
          input: { file_path: 'web/src/session/types.ts' },
        }),
        createContentBlock({
          type: 'tool_use',
          name: 'Edit',
          id: 'tool-e1',
          input: { file_path: 'web/src/themes/claude/claude.css', old_string: 'old', new_string: 'new' },
        }),
        createContentBlock({
          type: 'tool_use',
          name: 'Bash',
          id: 'tool-b1',
          input: { command: 'cd web && npm test' },
        }),
      ],
    }),
  },
};

export const WithToolResults: Story = {
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [
        createToolResult({
          toolUseId: 'tool-1',
          content: 'export function formatDate(date: Date): string {\n  return date.toISOString().split("T")[0];\n}',
        }),
      ],
    }),
  },
};

export const WithFileChangeAndDiff: Story = {
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [
        createToolResult({
          toolUseId: 'tool-edit-1',
          content: '',
          result: createToolUseResultData({
            type: 'update',
            filePath: 'web/src/themes/claude/claude.css',
            structuredPatch: [{
              oldFileName: 'web/src/themes/claude/claude.css',
              newFileName: 'web/src/themes/claude/claude.css',
              hunks: [{
                oldStart: 65,
                oldLines: 5,
                newStart: 65,
                newLines: 4,
                changes: [
                  { type: 'normal', content: '.claude-message {' },
                  { type: 'del', content: '  padding: 12px 16px;', oldLine: 67 },
                  { type: 'add', content: '  padding: 4px 12px;', newLine: 67 },
                  { type: 'del', content: '  gap: var(--space-3);', oldLine: 68 },
                  { type: 'add', content: '  gap: var(--space-2);', newLine: 68 },
                  { type: 'normal', content: '  line-height: 1.4;' },
                ],
              }],
            }],
          }),
        }),
      ],
    }),
  },
};

export const WithNewFile: Story = {
  args: {
    message: createUserMessage({
      textContent: undefined,
      toolResults: [
        createToolResult({
          toolUseId: 'tool-create-1',
          content: '',
          result: createToolUseResultData({
            type: 'create',
            filePath: 'web/src/themes/claude/ClaudeDiffBlock.tsx',
          }),
        }),
      ],
    }),
  },
};

/** Demonstrates the main visual improvement: tool results flow inline without user turn breaks */
export const ConversationFlow: StoryObj = {
  render: () => {
    const assistantWithTools = createMessage({
      blocks: [
        createContentBlock({ type: 'text', text: 'Let me read the file and make the changes.' }),
        createContentBlock({
          type: 'tool_use',
          name: 'Read',
          id: 'tool-r1',
          input: { file_path: 'web/src/themes/claude/claude.css' },
        }),
        createContentBlock({
          type: 'tool_use',
          name: 'Edit',
          id: 'tool-e1',
          input: { file_path: 'web/src/themes/claude/claude.css', old_string: 'padding: 4px;', new_string: 'padding: 2px;' },
        }),
      ],
    });

    const toolResults = createUserMessage({
      textContent: undefined,
      toolResults: [
        createToolResult({
          toolUseId: 'tool-r1',
          content: '.claude-message {\n  font-family: var(--font-mono);\n  padding: 4px 12px;\n}',
        }),
        createToolResult({
          toolUseId: 'tool-e1',
          content: '',
          result: createToolUseResultData({
            type: 'update',
            filePath: 'web/src/themes/claude/claude.css',
            structuredPatch: [{
              oldFileName: 'claude.css',
              newFileName: 'claude.css',
              hunks: [{
                oldStart: 80, oldLines: 3, newStart: 80, newLines: 3,
                changes: [
                  { type: 'normal', content: '.claude-message {' },
                  { type: 'del', content: '  padding: 4px;', oldLine: 81 },
                  { type: 'add', content: '  padding: 2px;', newLine: 81 },
                  { type: 'normal', content: '}' },
                ],
              }],
            }],
          }),
        }),
      ],
    });

    const assistantContinues = createMessage({
      blocks: [
        createContentBlock({ type: 'text', text: 'I\'ve updated the padding. The change reduces vertical spacing to match the real CLI density.' }),
      ],
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <ClaudeMessageBlock message={assistantWithTools} />
        <ClaudeMessageBlock message={toolResults} />
        <ClaudeMessageBlock message={assistantContinues} />
      </div>
    );
  },
};

export const WithThinkingHidden: StoryObj = {
  render: () => (
    <BulkCollapseProvider value={{ hideThinking: true }}>
      <ClaudeMessageBlock
        message={createMessage({
          blocks: [
            createContentBlock({ type: 'thinking', thinking: 'This reasoning should be hidden when hideThinking is true.' }),
            createContentBlock({ type: 'text', text: 'The text remains visible even when thinking is hidden.' }),
          ],
        })}
      />
    </BulkCollapseProvider>
  ),
};
