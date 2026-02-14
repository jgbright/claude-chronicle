import type { Meta, StoryObj } from '@storybook/react';
import { CopilotAnnotationBlock } from './CopilotAnnotationBlock';

const meta = {
  component: CopilotAnnotationBlock,
  parameters: { theme: 'copilot' },
} satisfies Meta<typeof CopilotAnnotationBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
  args: {
    content: 'This section demonstrates how the session parser handles malformed JSONL input gracefully by skipping invalid lines rather than failing the entire parse.',
  },
};

export const WithRemoveButton: Story = {
  args: {
    content: 'An important note about the refactoring approach chosen here.',
    onDelete: () => {},
  },
};
