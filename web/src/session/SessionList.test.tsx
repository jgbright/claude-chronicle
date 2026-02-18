import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionList } from './SessionList';
import { formatSize, formatDate } from '../shared/formatUtils';
import { createSessionInfo } from '../test/factories';

describe('formatSize', () => {
  it('formats bytes', () => {
    expect(formatSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatSize(1536 * 1024)).toBe('1.5 MB');
  });

  it('formats exactly 1 KB boundary', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
  });

  it('formats exactly 1 MB boundary', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('formats 0 bytes', () => {
    expect(formatSize(0)).toBe('0 B');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
  });
});

describe('SessionList', () => {
  it('renders "Sessions" title', () => {
    render(<SessionList sessions={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('renders session items with titles', () => {
    const sessions = [
      createSessionInfo({ id: 's1', projectName: 'Project A', title: 'Fix the build' }),
      createSessionInfo({ id: 's2', projectName: 'Project B', title: 'Add new feature' }),
    ];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Fix the build')).toBeInTheDocument();
    expect(screen.getByText('Add new feature')).toBeInTheDocument();
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
  });

  it('renders project name as primary when no title', () => {
    const sessions = [
      createSessionInfo({ id: 's1', projectName: 'Project A', title: undefined }),
    ];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Project A')).toBeInTheDocument();
  });

  it('renders truncated session id', () => {
    const sessions = [
      createSessionInfo({ id: 'abcdefgh-1234-5678-9012' }),
    ];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('abcdefgh...')).toBeInTheDocument();
  });

  it('highlights selected session', () => {
    const sessions = [
      createSessionInfo({ id: 's1' }),
      createSessionInfo({ id: 's2' }),
    ];
    const { container } = render(
      <SessionList sessions={sessions} selectedId="s1" onSelect={vi.fn()} />
    );
    const selected = container.querySelector('.session-list__item--selected');
    expect(selected).not.toBeNull();
  });

  it('calls onSelect with session id when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const sessions = [createSessionInfo({ id: 'sess-abc', projectName: 'My Proj', title: 'My title' })];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={onSelect} />);
    await user.click(screen.getByText('My title'));
    expect(onSelect).toHaveBeenCalledWith('sess-abc');
  });

  it('renders file size for each session', () => {
    const sessions = [createSessionInfo({ id: 's1', sizeBytes: 2048 })];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('renders empty list without errors', () => {
    render(
      <SessionList sessions={[]} selectedId={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText('No sessions found')).toBeInTheDocument();
  });

  it('shows three-dot menu button on sessions', () => {
    const sessions = [createSessionInfo({ id: 's1', title: 'Active session' })];
    const { container } = render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} onDelete={vi.fn()} />
    );
    const menuBtn = container.querySelector('.session-list__menu-btn');
    expect(menuBtn).not.toBeNull();
  });

  it('shows Hide option in menu when clicking three-dot', async () => {
    const user = userEvent.setup();
    const sessions = [createSessionInfo({ id: 's1', title: 'Test' })];
    render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} onDelete={vi.fn()} />
    );
    await user.click(screen.getByTitle('Session actions'));
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('calls onDelete when Hide is clicked from menu', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const sessions = [createSessionInfo({ id: 's1', title: 'Test' })];
    render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} onDelete={onDelete} />
    );
    await user.click(screen.getByTitle('Session actions'));
    await user.click(screen.getByText('Hide'));
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('shows Restore option for deleted sessions', async () => {
    const user = userEvent.setup();
    const sessions = [createSessionInfo({ id: 's1', title: 'Deleted session', deleted: true })];
    render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} onRestore={vi.fn()} />
    );
    // Expand the "Hidden" section first
    await user.click(screen.getByText('Hidden'));
    await user.click(screen.getByTitle('Session actions'));
    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  it('calls onRestore when Restore is clicked', async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const sessions = [createSessionInfo({ id: 's1', title: 'Deleted', deleted: true })];
    render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} onRestore={onRestore} />
    );
    await user.click(screen.getByText('Hidden'));
    await user.click(screen.getByTitle('Session actions'));
    await user.click(screen.getByText('Restore'));
    expect(onRestore).toHaveBeenCalledWith('s1');
  });

  it('separates hidden sessions into collapsible section', () => {
    const sessions = [
      createSessionInfo({ id: 's1', title: 'Active', deleted: false }),
      createSessionInfo({ id: 's2', title: 'Gone', deleted: true }),
    ];
    render(
      <SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});
