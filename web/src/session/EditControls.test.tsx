import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditControls } from './EditControls';

function renderControls(overrides = {}) {
  const props = {
    messageId: 'msg-1',
    onDelete: vi.fn(),
    onAnnotate: vi.fn(),
    ...overrides,
  };
  const result = render(<EditControls {...props} />);
  return { ...result, props };
}

describe('EditControls', () => {
  it('renders Delete button', () => {
    renderControls();
    expect(screen.getByTitle('Delete this message')).toBeInTheDocument();
  });

  it('renders Annotate button', () => {
    renderControls();
    expect(screen.getByTitle('Add annotation after this message')).toBeInTheDocument();
  });

  it('calls onDelete with messageId when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderControls({ onDelete });
    await user.click(screen.getByTitle('Delete this message'));
    expect(onDelete).toHaveBeenCalledWith('msg-1');
  });

  it('shows annotation textarea when Annotate is clicked', async () => {
    const user = userEvent.setup();
    renderControls();
    await user.click(screen.getByTitle('Add annotation after this message'));
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
  });

  it('shows Cancel and Add buttons when annotation form is open', async () => {
    const user = userEvent.setup();
    renderControls();
    await user.click(screen.getByTitle('Add annotation after this message'));
    const annotateSection = screen.getByPlaceholderText('Add commentary (Markdown supported)...').closest('.edit-controls__annotate')!;
    expect(within(annotateSection as HTMLElement).getByText('Cancel')).toBeInTheDocument();
    expect(within(annotateSection as HTMLElement).getByText('Add')).toBeInTheDocument();
  });

  it('hides annotation form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderControls();
    await user.click(screen.getByTitle('Add annotation after this message'));
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Add commentary (Markdown supported)...')).not.toBeInTheDocument();
  });

  it('calls onAnnotate with messageId and trimmed text when Add is clicked', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderControls({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation after this message'));
    await user.type(screen.getByPlaceholderText('Add commentary (Markdown supported)...'), '  My note  ');
    await user.click(screen.getByText('Add'));
    expect(onAnnotate).toHaveBeenCalledWith('msg-1', 'My note');
  });

  it('does not call onAnnotate when text is empty', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderControls({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation after this message'));
    await user.click(screen.getByText('Add'));
    expect(onAnnotate).not.toHaveBeenCalled();
  });

  it('does not call onAnnotate when text is only whitespace', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderControls({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation after this message'));
    await user.type(screen.getByPlaceholderText('Add commentary (Markdown supported)...'), '   ');
    await user.click(screen.getByText('Add'));
    expect(onAnnotate).not.toHaveBeenCalled();
  });

  it('clears textarea and hides form after successful annotation', async () => {
    const user = userEvent.setup();
    const onAnnotate = vi.fn();
    renderControls({ onAnnotate });
    await user.click(screen.getByTitle('Add annotation after this message'));
    await user.type(screen.getByPlaceholderText('Add commentary (Markdown supported)...'), 'Text');
    await user.click(screen.getByText('Add'));
    expect(screen.queryByPlaceholderText('Add commentary (Markdown supported)...')).not.toBeInTheDocument();
  });

  it('toggles annotation form off when Annotate is clicked again', async () => {
    const user = userEvent.setup();
    renderControls();
    const annotateBtn = screen.getByTitle('Add annotation after this message');
    await user.click(annotateBtn);
    expect(screen.getByPlaceholderText('Add commentary (Markdown supported)...')).toBeInTheDocument();
    await user.click(annotateBtn);
    expect(screen.queryByPlaceholderText('Add commentary (Markdown supported)...')).not.toBeInTheDocument();
  });
});
