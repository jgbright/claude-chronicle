import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

function renderToolbar(overrides = {}) {
  const props = {
    theme: 'claude' as const,
    onThemeChange: vi.fn(),
    hasSession: true,
    isCollapsed: false,
    onToggleCollapsed: vi.fn(),
    ...overrides,
  };
  const result = render(<Toolbar {...props} />);
  return { ...result, props };
}

describe('Toolbar', () => {
  it('renders the brand name', () => {
    renderToolbar();
    expect(screen.getByText('Chronicle')).toBeInTheDocument();
  });

  it('renders session title when provided', () => {
    renderToolbar({ sessionTitle: 'My Session' });
    expect(screen.getByText('My Session')).toBeInTheDocument();
  });

  it('does not render session title when not provided', () => {
    const { container } = renderToolbar();
    expect(container.querySelector('.toolbar__title')).toBeNull();
  });

  it('renders theme buttons', () => {
    const { container } = renderToolbar();
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    expect(themeButtons).toHaveLength(2);
  });

  it('calls onThemeChange when Claude button is clicked', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const { container } = renderToolbar({ theme: 'copilot', onThemeChange });
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    await user.click(themeButtons[0]);
    expect(onThemeChange).toHaveBeenCalledWith('claude');
  });

  it('calls onThemeChange when Copilot button is clicked', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const { container } = renderToolbar({ onThemeChange });
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    await user.click(themeButtons[1]);
    expect(onThemeChange).toHaveBeenCalledWith('copilot');
  });

  it('marks Claude theme button as active when theme is claude', () => {
    const { container } = renderToolbar({ theme: 'claude' });
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    expect(themeButtons[0].className).toContain('toolbar__theme-btn--active');
    expect(themeButtons[1].className).not.toContain('toolbar__theme-btn--active');
  });

  it('marks Copilot theme button as active when theme is copilot', () => {
    const { container } = renderToolbar({ theme: 'copilot' });
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    expect(themeButtons[0].className).not.toContain('toolbar__theme-btn--active');
    expect(themeButtons[1].className).toContain('toolbar__theme-btn--active');
  });

  it('renders Undo and Redo buttons when provided', () => {
    renderToolbar({ onUndo: vi.fn(), onRedo: vi.fn() });
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('Undo button is disabled when canUndo is false', () => {
    renderToolbar({ onUndo: vi.fn(), canUndo: false });
    expect(screen.getByText('Undo')).toBeDisabled();
  });

  it('Undo button is enabled when canUndo is true', () => {
    renderToolbar({ onUndo: vi.fn(), canUndo: true });
    expect(screen.getByText('Undo')).not.toBeDisabled();
  });

  it('calls onUndo when Undo is clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    renderToolbar({ onUndo, canUndo: true });
    await user.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('renders Export button when onExport is provided', () => {
    renderToolbar({ onExport: vi.fn() });
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('does not render Export button when onExport is not provided', () => {
    renderToolbar();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('does not render Export button when hasSession is false', () => {
    renderToolbar({ hasSession: false, onExport: vi.fn() });
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('calls onExport when Export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderToolbar({ onExport });
    await user.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('shows branch name as descriptor for non-main branch', () => {
    const { container } = renderToolbar({ branch: 'feat/my-feature', version: '0.1.0' });
    const desc = container.querySelector('.toolbar__descriptor');
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toBe('feat/my-feature');
  });

  it('shows version as descriptor when branch is "main"', () => {
    const { container } = renderToolbar({ branch: 'main', version: '0.1.1' });
    const desc = container.querySelector('.toolbar__descriptor');
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toBe('v0.1.1');
  });

  it('shows version as descriptor when branch is undefined', () => {
    const { container } = renderToolbar({ version: '0.2.0' });
    const desc = container.querySelector('.toolbar__descriptor');
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toBe('v0.2.0');
  });

  it('shows "dev" without v prefix for non-semver version', () => {
    const { container } = renderToolbar({ version: 'dev' });
    const desc = container.querySelector('.toolbar__descriptor');
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toBe('dev');
  });

  it('shows CI version without v prefix', () => {
    const { container } = renderToolbar({ version: 'ci-abc1234' });
    const desc = container.querySelector('.toolbar__descriptor');
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toBe('ci-abc1234');
  });

  it('shows no descriptor when both version and branch are undefined', () => {
    const { container } = renderToolbar();
    expect(container.querySelector('.toolbar__descriptor')).toBeNull();
  });

  it('renders Collapse dropdown when toggle handlers provided', () => {
    renderToolbar({
      onToggleCollapseThinking: vi.fn(),
      onToggleCollapseToolResults: vi.fn(),
      onToggleShowHidden: vi.fn(),
    });
    expect(screen.getByText(/Collapse/)).toBeInTheDocument();
  });

  it('shows save state indicator', () => {
    renderToolbar({ saveState: 'saved' });
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });
});
