import type { Meta, StoryObj } from '@storybook/react';
import { ClaudeAnnotationBlock } from './ClaudeAnnotationBlock';

const meta = {
  component: ClaudeAnnotationBlock,
  parameters: { theme: 'claude' },
} satisfies Meta<typeof ClaudeAnnotationBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ViewMode: Story = {
  args: {
    content: 'This section demonstrates how the assistant handles complex refactoring tasks with multiple file changes.',
  },
};

export const EditMode: Story = {
  args: {
    content: 'An editable annotation that can be removed by the curator.',
    editMode: true,
    onDelete: () => console.log('Delete clicked'),
  },
};
