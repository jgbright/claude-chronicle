import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionViewer } from './SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { claudeComponents } from '../themes/claude/components';
import {
  createParsedSession,
  createManifest,
  createMessage,
  createUserMessage,
  createContentBlock,
} from '../test/factories';

function renderViewer(overrides = {}) {
  const props = {
    session: createParsedSession(),
    manifest: null as ReturnType<typeof createManifest> | null,
    editMode: false,
    onAddEdit: vi.fn(),
    onRemoveEdit: vi.fn(),
    ...overrides,
  };
  const result = render(
    <ThemeComponentProvider value={claudeComponents}>
      <SessionViewer {...props} />
    </ThemeComponentProvider>
  );
  return { ...result, props };
}

describe('SessionViewer', () => {
  it('renders project name', () => {
    const { container } = renderViewer();
    const project = container.querySelector('.session-viewer__project');
    expect(project!.textContent).toBe('my-project');
  });

  it('renders message count', () => {
    const { container } = renderViewer();
    const count = container.querySelector('.session-viewer__count');
    expect(count!.textContent).toContain('2 messages');
  });

  it('renders edit count when manifest has edits', () => {
    const manifest = createManifest({
      edits: [{ type: 'delete', blockId: 'x' }],
    });
    const { container } = renderViewer({ manifest });
    const count = container.querySelector('.session-viewer__count');
    expect(count!.textContent).toContain('1 edits applied');
  });

  it('renders user and assistant messages', () => {
    const { container } = renderViewer();
    expect(container.querySelector('.claude-message--user')).not.toBeNull();
    expect(container.querySelector('.claude-message--assistant')).not.toBeNull();
  });

  it('renders collapsed group for collapsed messages', () => {
    const session = createParsedSession({
      messages: [
        createMessage({ id: 'a1' }),
        createMessage({ id: 'a2' }),
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'collapse', blockIds: ['a1', 'a2'], summary: 'Two items' }],
    });
    const { container } = renderViewer({ session, manifest });
    expect(container.querySelector('.claude-collapsed')).not.toBeNull();
    expect(container.querySelector('.claude-collapsed__summary')!.textContent).toBe('Two items');
  });

  it('renders annotation blocks', () => {
    const session = createParsedSession({
      messages: [createMessage({ id: 'a1' })],
    });
    const manifest = createManifest({
      edits: [
        { type: 'annotate', afterBlockId: 'a1', content: 'My annotation', id: 'ann-1' },
      ],
    });
    const { container } = renderViewer({ session, manifest });
    expect(container.querySelector('.claude-annotation')).not.toBeNull();
    expect(container.querySelector('.claude-annotation__badge')!.textContent).toBe('# commentary');
  });

  it('does not show edit controls when editMode is false', () => {
    const { container } = renderViewer();
    expect(container.querySelector('.edit-controls')).toBeNull();
  });

  it('shows edit controls when editMode is true', () => {
    const { container } = renderViewer({ editMode: true });
    expect(container.querySelectorAll('.edit-controls').length).toBeGreaterThan(0);
  });

  it('calls onAddEdit with delete edit when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onAddEdit = vi.fn();
    const session = createParsedSession({
      messages: [createUserMessage({ id: 'u1' })],
    });
    const { container } = renderViewer({ session, editMode: true, onAddEdit });
    const deleteBtn = container.querySelector('.edit-controls__btn--delete')!;
    await user.click(deleteBtn);
    expect(onAddEdit).toHaveBeenCalledWith({ type: 'delete', blockId: 'u1' });
  });

  it('shows bulk action buttons in edit mode', () => {
    const { container } = renderViewer({ editMode: true });
    expect(container.querySelector('.bulk-actions')).not.toBeNull();
  });

  it('does not show bulk action buttons in view mode', () => {
    const { container } = renderViewer({ editMode: false });
    expect(container.querySelector('.bulk-actions')).toBeNull();
  });

  it('hides deleted messages', () => {
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Visible' }),
        createMessage({ id: 'a1', blocks: [createContentBlock({ text: 'Hidden' })] }),
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'delete', blockId: 'a1' }],
    });
    renderViewer({ session, manifest });
    expect(screen.getByText('Visible')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('applies text edits to messages', () => {
    const session = createParsedSession({
      messages: [createUserMessage({ id: 'u1', textContent: 'Original' })],
    });
    const manifest = createManifest({
      edits: [{ type: 'editText', blockId: 'u1', newContent: 'Edited' }],
    });
    renderViewer({ session, manifest });
    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
  });

  it('collapse all thinking creates correct collapse edit', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createMessage({ id: 'think1', blocks: [createContentBlock({ type: 'thinking', thinking: 'hmm' })] }),
        createMessage({ id: 'think2', blocks: [createContentBlock({ type: 'thinking', thinking: 'ok' })] }),
        createMessage({ id: 'text1', blocks: [createContentBlock({ type: 'text', text: 'hello' })] }),
      ],
    });
    const onAddEdit = vi.fn();
    renderViewer({ session, editMode: true, onAddEdit });
    const btn = screen.getByText('Collapse all thinking');
    await user.click(btn);
    expect(onAddEdit).toHaveBeenCalledWith({
      type: 'collapse',
      blockIds: ['think1', 'think2'],
      summary: '2 thinking blocks',
    });
  });

  it('collapse all thinking is no-op when no thinking blocks', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createMessage({ id: 'text1', blocks: [createContentBlock({ type: 'text', text: 'hello' })] }),
        createMessage({ id: 'text2', blocks: [createContentBlock({ type: 'text', text: 'world' })] }),
      ],
    });
    const onAddEdit = vi.fn();
    renderViewer({ session, editMode: true, onAddEdit });
    const btn = screen.getByText('Collapse all thinking');
    await user.click(btn);
    expect(onAddEdit).not.toHaveBeenCalled();
  });

  it('collapse all tool results creates correct collapse edit', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'tr1', toolResults: [{ toolUseId: 't1', content: 'output' }] }),
        createUserMessage({ id: 'tr2', toolResults: [{ toolUseId: 't2', content: 'output2' }] }),
        createUserMessage({ id: 'u1', textContent: 'hello' }),
      ],
    });
    const onAddEdit = vi.fn();
    renderViewer({ session, editMode: true, onAddEdit });
    const btn = screen.getByText('Collapse all tool results');
    await user.click(btn);
    expect(onAddEdit).toHaveBeenCalledWith({
      type: 'collapse',
      blockIds: ['tr1', 'tr2'],
      summary: '2 tool results',
    });
  });

  it('collapse all tool results is no-op when no tool results', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'hello' }),
        createUserMessage({ id: 'u2', textContent: 'world' }),
      ],
    });
    const onAddEdit = vi.fn();
    renderViewer({ session, editMode: true, onAddEdit });
    const btn = screen.getByText('Collapse all tool results');
    await user.click(btn);
    expect(onAddEdit).not.toHaveBeenCalled();
  });

  it('shows undo and redo buttons in edit mode', () => {
    renderViewer({ editMode: true });
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('undo button is disabled when canUndo is false', () => {
    renderViewer({ editMode: true, canUndo: false });
    const undoBtn = screen.getByText('Undo');
    expect(undoBtn).toBeDisabled();
  });

  it('redo button is disabled when canRedo is false', () => {
    renderViewer({ editMode: true, canRedo: false });
    const redoBtn = screen.getByText('Redo');
    expect(redoBtn).toBeDisabled();
  });

  it('undo button is enabled when canUndo is true', () => {
    renderViewer({ editMode: true, canUndo: true });
    const undoBtn = screen.getByText('Undo');
    expect(undoBtn).not.toBeDisabled();
  });

  it('undo button calls onUndo when clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    renderViewer({ editMode: true, canUndo: true, onUndo });
    await user.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('redo button calls onRedo when clicked', async () => {
    const user = userEvent.setup();
    const onRedo = vi.fn();
    renderViewer({ editMode: true, canRedo: true, onRedo });
    await user.click(screen.getByText('Redo'));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('collapse toggle removes existing collapse on second click', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createMessage({ id: 'think1', blocks: [createContentBlock({ type: 'thinking', thinking: 'hmm' })] }),
        createMessage({ id: 'think2', blocks: [createContentBlock({ type: 'thinking', thinking: 'ok' })] }),
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'collapse', blockIds: ['think1', 'think2'], summary: '2 thinking blocks' }],
    });
    const onRemoveEdit = vi.fn();
    const onAddEdit = vi.fn();
    renderViewer({ session, manifest, editMode: true, onAddEdit, onRemoveEdit });
    const btn = screen.getByText('Collapse all thinking');
    await user.click(btn);
    // Should remove existing collapse (index 0) instead of adding
    expect(onRemoveEdit).toHaveBeenCalledWith(0);
    expect(onAddEdit).not.toHaveBeenCalled();
  });

  it('show deleted toggle renders ghost blocks with restore button', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Visible' }),
        createMessage({ id: 'a1', blocks: [createContentBlock({ text: 'Deleted msg' })] }),
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'delete', blockId: 'a1' }],
    });
    const onRemoveEdit = vi.fn();
    const { container } = renderViewer({ session, manifest, editMode: true, onRemoveEdit });

    // Initially deleted message is hidden
    expect(container.querySelector('.session-viewer__deleted-ghost')).toBeNull();

    // Click "Show deleted"
    await user.click(screen.getByText('Show deleted'));

    // Now ghost should appear
    expect(container.querySelector('.session-viewer__deleted-ghost')).not.toBeNull();
    const restoreBtn = screen.getByText('Restore');
    expect(restoreBtn).toBeInTheDocument();

    // Click restore
    await user.click(restoreBtn);
    expect(onRemoveEdit).toHaveBeenCalledWith(0);
  });

  it('annotation removal calls onRemoveEdit with correct index', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [createMessage({ id: 'a1' })],
    });
    const manifest = createManifest({
      edits: [
        { type: 'delete', blockId: 'some-other' },
        { type: 'annotate', afterBlockId: 'a1', content: 'My note', id: 'ann-1' },
      ],
    });
    const onRemoveEdit = vi.fn();
    const { container } = renderViewer({ session, manifest, editMode: true, onRemoveEdit });
    const deleteBtn = container.querySelector('.claude-annotation__delete')!;
    expect(deleteBtn).not.toBeNull();
    await user.click(deleteBtn);
    expect(onRemoveEdit).toHaveBeenCalledWith(1);
  });
});
