import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar } from './Toolbar';

const meta = {
  component: Toolbar,
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ClaudeTheme: Story = {
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    sessionTitle: 'My Session',
    editMode: false,
    onEditModeChange: () => {},
    onExport: () => {},
    hasSession: true,
  },
  parameters: { theme: 'claude' },
};

export const CopilotTheme: Story = {
  args: {
    theme: 'copilot',
    onThemeChange: () => {},
    sessionTitle: 'My Session',
    editMode: false,
    onEditModeChange: () => {},
    onExport: () => {},
    hasSession: true,
  },
  parameters: { theme: 'copilot' },
};

export const EditMode: Story = {
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    editMode: true,
    onEditModeChange: () => {},
    onExport: () => {},
    hasSession: true,
  },
  parameters: { theme: 'claude' },
};

export const NoSession: Story = {
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    editMode: false,
    onEditModeChange: () => {},
    hasSession: false,
  },
  parameters: { theme: 'claude' },
};
