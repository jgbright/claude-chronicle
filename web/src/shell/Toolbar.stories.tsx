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
    onExport: () => {},
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: true,
    canRedo: false,
    onToggleCollapseThinking: () => {},
    onToggleCollapseToolResults: () => {},
    onToggleShowHidden: () => {},
  },
  parameters: { theme: 'claude' },
};

export const CopilotTheme: Story = {
  args: {
    theme: 'copilot',
    onThemeChange: () => {},
    sessionTitle: 'My Session',
    onExport: () => {},
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: false,
    canRedo: false,
  },
  parameters: { theme: 'copilot' },
};

export const NoSession: Story = {
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    hasSession: false,
    isCollapsed: false,
    onToggleCollapsed: () => {},
  },
  parameters: { theme: 'claude' },
};

export const WithSaveState: Story = {
  args: {
    theme: 'claude',
    onThemeChange: () => {},
    sessionTitle: 'Saved Session',
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: () => {},
    onUndo: () => {},
    onRedo: () => {},
    canUndo: true,
    canRedo: false,
    saveState: 'saved',
  },
  parameters: { theme: 'claude' },
};
