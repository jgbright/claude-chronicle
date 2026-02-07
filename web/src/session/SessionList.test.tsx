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
    // The exact output depends on locale; verify it contains month and day
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
  });
});

describe('SessionList', () => {
  it('renders "Sessions" title', () => {
    render(<SessionList sessions={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('renders session items', () => {
    const sessions = [
      createSessionInfo({ id: 's1', projectName: 'Project A' }),
      createSessionInfo({ id: 's2', projectName: 'Project B' }),
    ];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
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
    const sessions = [createSessionInfo({ id: 'sess-abc', projectName: 'My Proj' })];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={onSelect} />);
    await user.click(screen.getByText('My Proj'));
    expect(onSelect).toHaveBeenCalledWith('sess-abc');
  });

  it('renders file size for each session', () => {
    const sessions = [createSessionInfo({ id: 's1', sizeBytes: 2048 })];
    render(<SessionList sessions={sessions} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('renders empty list without errors', () => {
    const { container } = render(
      <SessionList sessions={[]} selectedId={null} onSelect={vi.fn()} />
    );
    const items = container.querySelector('.session-list__items');
    expect(items?.children).toHaveLength(0);
  });
});
