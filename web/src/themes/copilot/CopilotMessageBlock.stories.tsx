import type { Meta, StoryObj } from '@storybook/react';
import { CopilotMessageBlock } from './CopilotMessageBlock';
import { BulkCollapseProvider } from '../../session/BulkCollapseContext';
import { createMessage, createUserMessage, createContentBlock, createToolResult, createToolUseResultData } from '../../test/factories';

const meta = {
  component: CopilotMessageBlock,
  parameters: { theme: 'copilot' },
} satisfies Meta<typeof CopilotMessageBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    message: createUserMessage({
      textContent: 'Can you help me refactor this function?',
    }),
  },
};

export const UserMessageWithCode: Story = {
  args: {
    message: createUserMessage({
      textContent: 'What does this function do?\n\n```typescript\nfunction parse(raw: string) {\n  return JSON.parse(raw);\n}\n```',
    }),
  },
};

export const AssistantText: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'text',
          text: 'Sure! I can help you refactor that function. Let me take a look at the code and suggest some improvements for readability and maintainability.',
        }),
      ],
    }),
  },
};

export const WithThinking: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'thinking',
          thinking: 'The user wants to refactor a function. I should consider the current structure, identify code smells like long parameter lists or deeply nested conditionals, and suggest a cleaner approach using extract method or early returns.',
        }),
        createContentBlock({
          type: 'text',
          text: 'I see a few opportunities to improve this function. We can extract the validation logic into a separate helper and use early returns to reduce nesting.',
        }),
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
          id: 'tool-1',
          name: 'Read',
          input: { file_path: '/src/utils/parser.ts' },
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
          content: 'export function parseConfig(raw: string): Config {\n  const data = JSON.parse(raw);\n  return validate(data);\n}',
        }),
      ],
    }),
  },
};

export const LongConversation: Story = {
  args: {
    message: createMessage({
      blocks: [
        createContentBlock({
          type: 'text',
          text: 'Here\'s a comprehensive refactoring plan:\n\n1. **Extract validation** into `validateInput()`\n2. **Simplify conditionals** using early returns\n3. **Add type guards** for runtime safety\n\n> Note: These changes are backwards-compatible.\n\n```typescript\nfunction validateInput(data: unknown): data is ValidInput {\n  return typeof data === "object" && data !== null;\n}\n```\n\nShall I proceed with the implementation?',
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
          input: { file_path: 'web/src/themes/copilot/copilot.css', old_string: 'padding: 12px 16px;', new_string: 'padding: 4px 12px;' },
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
          input: { pattern: 'CopilotMessageBlock', path: 'web/src/', glob: '*.tsx' },
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
          input: { file_path: 'web/src/themes/copilot/copilot.css', old_string: 'old', new_string: 'new' },
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
            filePath: 'web/src/themes/copilot/copilot.css',
            structuredPatch: [{
              oldFileName: 'web/src/themes/copilot/copilot.css',
              newFileName: 'web/src/themes/copilot/copilot.css',
              hunks: [{
                oldStart: 69,
                oldLines: 5,
                newStart: 69,
                newLines: 4,
                changes: [
                  { type: 'normal', content: '.copilot-message {' },
                  { type: 'del', content: '  padding: 12px 16px;', oldLine: 71 },
                  { type: 'add', content: '  padding: 4px 12px;', newLine: 71 },
                  { type: 'del', content: '  gap: var(--space-3);', oldLine: 72 },
                  { type: 'add', content: '  gap: var(--space-2);', newLine: 72 },
                  { type: 'normal', content: '  transition: background var(--transition-base);' },
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
            filePath: 'web/src/shared/diffUtils.ts',
          }),
        }),
      ],
    }),
  },
};

export const WithThinkingHidden: StoryObj = {
  render: () => (
    <BulkCollapseProvider value={{ hideThinking: true }}>
      <CopilotMessageBlock
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
