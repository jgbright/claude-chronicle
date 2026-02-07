import type { Meta, StoryObj } from '@storybook/react';
import { ClaudeMessageBlock } from './ClaudeMessageBlock';
import { createMessage, createUserMessage, createContentBlock, createToolResult } from '../../test/factories';

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
