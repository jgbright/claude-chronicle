import type { Meta, StoryObj } from '@storybook/react';
import { ClaudeCollapsedGroup } from './ClaudeCollapsedGroup';

const meta = {
  component: ClaudeCollapsedGroup,
  parameters: { theme: 'claude' },
} satisfies Meta<typeof ClaudeCollapsedGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    summary: 'File operations',
    count: 5,
  },
};

export const LongSummary: Story = {
  args: {
    summary: 'Refactored authentication module and updated related test files across multiple packages',
    count: 12,
  },
};
