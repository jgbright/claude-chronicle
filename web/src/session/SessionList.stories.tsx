import type { Meta, StoryObj } from '@storybook/react';
import { SessionList } from './SessionList';
import { createSessionInfo, resetIdCounter } from '../test/factories';

const meta = {
  component: SessionList,
  decorators: [
    (Story) => {
      resetIdCounter();
      return <Story />;
    },
  ],
} satisfies Meta<typeof SessionList>;
export default meta;
type Story = StoryObj<typeof meta>;

const sessions = [
  createSessionInfo({ title: 'Implement auth flow', projectName: 'web-app' }),
  createSessionInfo({ title: 'Fix sidebar layout bug', projectName: 'web-app' }),
  createSessionInfo({ title: 'Add export feature', projectName: 'chronicle' }),
];

export const Default: Story = {
  args: {
    sessions,
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {},
  },
};

export const WithSelected: Story = {
  args: {
    sessions,
    selectedId: sessions[1].id,
    onSelect: () => {},
    onDelete: () => {},
  },
};

export const WithDeletedSessions: Story = {
  args: {
    sessions: [
      createSessionInfo({ title: 'Active session', projectName: 'my-project' }),
      createSessionInfo({ title: 'Hidden session', projectName: 'my-project', deleted: true }),
      createSessionInfo({ title: 'Another active session', projectName: 'my-project' }),
    ],
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {},
    onRestore: () => {},
  },
};

export const Empty: Story = {
  args: {
    sessions: [],
    selectedId: null,
    onSelect: () => {},
    onDelete: () => {},
  },
};
