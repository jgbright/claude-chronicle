import type { Meta, StoryObj } from '@storybook/react';
import { CopilotCollapsedGroup } from './CopilotCollapsedGroup';

const meta = {
  component: CopilotCollapsedGroup,
  parameters: { theme: 'copilot' },
} satisfies Meta<typeof CopilotCollapsedGroup>;

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
    summary: 'Refactored session parser to handle edge cases in JSONL format',
    count: 12,
  },
};
