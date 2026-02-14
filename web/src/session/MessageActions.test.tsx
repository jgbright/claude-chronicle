import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageActions } from './MessageActions';

function renderActions(overrides = {}) {
  const props = {
    messageId: 'msg-1',
    onHide: vi.fn(),
    onAnnotate: vi.fn(),
    ...overrides,
  };
  const result = render(<MessageActions {...props} />);
  return { ...result, props };
}

describe('MessageActions', () => {
  it('renders annotate and menu buttons', () => {
    renderActions();
    expect(screen.getByTitle('Add annotation')).toBeInTheDocument();
    expect(screen.getByTitle('More actions')).toBeInTheDocument();
  });

  it('opens dropdown menu when three-dot is clicked', async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByTitle('More actions'));
    expect(screen.getByText('Hide')).toBeInTheDocument();
    expect(screen.getByText('Annotate')).toBeInTheDocument();
  });

  it('calls onHide with messageId when Hide is clicked', async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    renderActions({ onHide });
    await user.click(screen.getByTitle('More actions'));
    await user.click(screen.getByText('Hide'));
    expect(onHide).toHaveBeenCalledWith('msg-1');
  });

  it('shows annotation form when annotate icon is clicked', async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByTitle('Add annotation'));
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
  });

  it('shows annotation form when Annotate menu item is clicked', async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByTitle('More actions'));
    await user.click(screen.getByText('Annotate'));
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
  });

  it('calls onAnnotate with messageId and text when Add is clicked', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderActions({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation'));
    await user.type(screen.getByPlaceholderText('Add commentary (Markdown supported)...'), '  My note  ');
    await user.click(screen.getByText('Add'));
    expect(onAnnotate).toHaveBeenCalledWith('msg-1', 'My note');
  });

  it('does not call onAnnotate when text is empty', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderActions({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation'));
    await user.click(screen.getByText('Add'));
    expect(onAnnotate).not.toHaveBeenCalled();
  });

  it('hides form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByTitle('Add annotation'));
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Add commentary (Markdown supported)...')).not.toBeInTheDocument();
  });

  it('clears form after successful annotation', async () => {
    const user = userEvent.setup();
    renderActions();
    await user.click(screen.getByTitle('Add annotation'));
    await user.type(screen.getByPlaceholderText('Add commentary (Markdown supported)...'), 'Text');
    await user.click(screen.getByText('Add'));
    expect(screen.queryByPlaceholderText('Add commentary (Markdown supported)...')).not.toBeInTheDocument();
  });
});
