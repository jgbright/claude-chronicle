import type { Meta, StoryObj } from '@storybook/react';
import { CopilotMessageBlock } from './CopilotMessageBlock';
import { createMessage, createUserMessage, createContentBlock, createToolResult } from '../../test/factories';

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
