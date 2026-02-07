import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

function renderToolbar(overrides = {}) {
  const props = {
    theme: 'claude' as const,
    onThemeChange: vi.fn(),
    editMode: false,
    onEditModeChange: vi.fn(),
    hasSession: true,
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
    // First theme button is Claude
    await user.click(themeButtons[0]);
    expect(onThemeChange).toHaveBeenCalledWith('claude');
  });

  it('calls onThemeChange when Copilot button is clicked', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const { container } = renderToolbar({ onThemeChange });
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    // Second theme button is Copilot
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

  it('renders View/Edit mode buttons when hasSession', () => {
    const { container } = renderToolbar({ hasSession: true });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    expect(modeButtons).toHaveLength(2);
  });

  it('does not render View/Edit buttons when hasSession is false', () => {
    const { container } = renderToolbar({ hasSession: false });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    expect(modeButtons).toHaveLength(0);
  });

  it('calls onEditModeChange(true) when Edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEditModeChange = vi.fn();
    const { container } = renderToolbar({ onEditModeChange });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    // Second mode button is Edit
    await user.click(modeButtons[1]);
    expect(onEditModeChange).toHaveBeenCalledWith(true);
  });

  it('calls onEditModeChange(false) when View button is clicked', async () => {
    const user = userEvent.setup();
    const onEditModeChange = vi.fn();
    const { container } = renderToolbar({ editMode: true, onEditModeChange });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    // First mode button is View
    await user.click(modeButtons[0]);
    expect(onEditModeChange).toHaveBeenCalledWith(false);
  });

  it('marks View button active when editMode is false', () => {
    const { container } = renderToolbar({ editMode: false });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    expect(modeButtons[0].className).toContain('toolbar__mode-btn--active');
    expect(modeButtons[1].className).not.toContain('toolbar__mode-btn--active');
  });

  it('marks Edit button active when editMode is true', () => {
    const { container } = renderToolbar({ editMode: true });
    const modeButtons = container.querySelectorAll('.toolbar__mode-btn');
    expect(modeButtons[0].className).not.toContain('toolbar__mode-btn--active');
    expect(modeButtons[1].className).toContain('toolbar__mode-btn--active');
  });

  it('renders Export HTML button when onExport is provided', () => {
    renderToolbar({ onExport: vi.fn() });
    expect(screen.getByText('Export HTML')).toBeInTheDocument();
  });

  it('does not render Export HTML button when onExport is not provided', () => {
    const { container } = renderToolbar();
    expect(container.querySelector('.toolbar__export-btn')).toBeNull();
  });

  it('calls onExport when Export HTML button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    const { container } = renderToolbar({ onExport });
    await user.click(container.querySelector('.toolbar__export-btn')!);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('does not render Export HTML button when hasSession is false', () => {
    const { container } = renderToolbar({ hasSession: false, onExport: vi.fn() });
    expect(container.querySelector('.toolbar__export-btn')).toBeNull();
  });
});
