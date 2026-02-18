import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionViewer } from './SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { claudeComponents } from '../themes/claude/components';
import {
  createParsedSession,
  createSessionInfo,
  createManifest,
  createMessage,
  createUserMessage,
  createContentBlock,
} from '../test/factories';

function renderViewer(overrides = {}) {
  const props = {
    session: createParsedSession(),
    manifest: null as ReturnType<typeof createManifest> | null,
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
  it('renders session title', () => {
    const { container } = renderViewer();
    const title = container.querySelector('.session-viewer__title');
    expect(title!.textContent).toContain('Test session title');
  });

  it('title is always clickable to edit when onUpdateTitle is provided', async () => {
    const user = userEvent.setup();
    const onUpdateTitle = vi.fn();
    const { container } = renderViewer({ onUpdateTitle });

    const titleSpan = container.querySelector('.session-viewer__title')!;
    expect(titleSpan.className).toContain('session-viewer__title--editable');

    await user.click(titleSpan);
    const input = container.querySelector('.session-viewer__title-input');
    expect(input).not.toBeNull();
  });

  it('calls onUpdateTitle and displays new title after inline edit', async () => {
    const user = userEvent.setup();
    let currentSession = createParsedSession({
      info: createSessionInfo({ id: 'sess-1', title: 'Old Title' }),
    });
    const onUpdateTitle = vi.fn((title: string) => {
      currentSession = createParsedSession({
        info: createSessionInfo({ id: 'sess-1', title }),
        messages: currentSession.messages,
      });
    });
    const { container, rerender } = renderViewer({
      session: currentSession, onUpdateTitle,
    });

    const titleSpan = container.querySelector('.session-viewer__title')!;
    await user.click(titleSpan);

    const input = container.querySelector('.session-viewer__title-input')! as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'New Title');

    await user.click(container.querySelector('.session-viewer__info')!);
    expect(onUpdateTitle).toHaveBeenCalledWith('New Title');

    rerender(
      <ThemeComponentProvider value={claudeComponents}>
        <SessionViewer
          session={currentSession}
          manifest={null}
          onAddEdit={vi.fn()}
          onRemoveEdit={vi.fn()}
          onUpdateTitle={onUpdateTitle}
        />
      </ThemeComponentProvider>
    );
    expect(container.querySelector('.session-viewer__title')!.textContent).toContain('New Title');
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

  it('renders hover action buttons on messages', () => {
    const { container } = renderViewer();
    expect(container.querySelectorAll('.message-actions').length).toBeGreaterThan(0);
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

  it('renders annotation blocks with remove button', () => {
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
    expect(container.querySelector('.claude-annotation__delete')).not.toBeNull();
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


  it('collapses file reads without collapsing other tool results when collapseFileReads is true', () => {
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'read1', toolResults: [{ toolUseId: 't1', content: 'output', result: { type: 'text', filePath: '/tmp/app.ts', content: 'const x = 1;' } }] }),
        createUserMessage({ id: 'cmd1', toolResults: [{ toolUseId: 't2', content: 'output2', result: { type: 'text', stdout: 'npm test' } }] }),
      ],
    });
    const { container } = renderViewer({ session, collapseFileReads: true });
    expect(container.querySelector('.claude-collapsed')).not.toBeNull();
    expect(container.querySelectorAll('.claude-collapsed').length).toBe(1);
  });

  it('show deleted toggle renders ghost blocks with restore button', () => {
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
    const { container } = renderViewer({ session, manifest, showDeleted: true, onRemoveEdit });

    expect(container.querySelector('.session-viewer__deleted-ghost')).not.toBeNull();
    const restoreBtn = screen.getByText('Restore');
    expect(restoreBtn).toBeInTheDocument();
  });

  it('collapsed group renders children when expanded', async () => {
    const user = userEvent.setup();
    const session = createParsedSession({
      messages: [
        createUserMessage({ id: 'u1', textContent: 'Visible' }),
        createMessage({ id: 'a1', blocks: [createContentBlock({ type: 'text', text: 'First collapsed' })] }),
        createMessage({ id: 'a2', blocks: [createContentBlock({ type: 'text', text: 'Second collapsed' })] }),
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'collapse', blockIds: ['a1', 'a2'], summary: 'Two items' }],
    });
    const { container } = renderViewer({ session, manifest });

    expect(screen.queryByText('First collapsed')).not.toBeInTheDocument();
    expect(screen.queryByText('Second collapsed')).not.toBeInTheDocument();

    const header = container.querySelector('.claude-collapsed__header')!;
    await user.click(header);

    expect(screen.getByText('First collapsed')).toBeInTheDocument();
    expect(screen.getByText('Second collapsed')).toBeInTheDocument();
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
    const { container } = renderViewer({ session, manifest, onRemoveEdit });
    const deleteBtn = container.querySelector('.claude-annotation__delete')!;
    expect(deleteBtn).not.toBeNull();
    await user.click(deleteBtn);
    expect(onRemoveEdit).toHaveBeenCalledWith(1);
  });

  it('shows pencil icon on editable title hover', () => {
    const { container } = renderViewer({ onUpdateTitle: vi.fn() });
    const pencil = container.querySelector('.session-viewer__title-pencil');
    expect(pencil).not.toBeNull();
  });

  it('does not show pencil icon when onUpdateTitle is not provided', () => {
    const { container } = renderViewer();
    const pencil = container.querySelector('.session-viewer__title-pencil');
    expect(pencil).toBeNull();
  });

  describe('read-only mode (no edit callbacks)', () => {
    it('does not render message actions when onAddEdit is omitted', () => {
      const { container } = renderViewer({ onAddEdit: undefined });
      expect(container.querySelectorAll('.message-actions').length).toBe(0);
    });

    it('renders annotation blocks without delete button when onRemoveEdit is omitted', () => {
      const session = createParsedSession({
        messages: [createMessage({ id: 'a1' })],
      });
      const manifest = createManifest({
        edits: [
          { type: 'annotate', afterBlockId: 'a1', content: 'Read-only note', id: 'ann-1' },
        ],
      });
      const { container } = renderViewer({
        session, manifest, onRemoveEdit: undefined,
      });
      expect(container.querySelector('.claude-annotation')).not.toBeNull();
      expect(container.querySelector('.claude-annotation__delete')).toBeNull();
    });

    it('renders deleted ghost blocks without Restore button when onRemoveEdit is omitted', () => {
      const session = createParsedSession({
        messages: [
          createUserMessage({ id: 'u1', textContent: 'Visible' }),
          createMessage({ id: 'a1', blocks: [createContentBlock({ text: 'Deleted msg' })] }),
        ],
      });
      const manifest = createManifest({
        edits: [{ type: 'delete', blockId: 'a1' }],
      });
      const { container } = renderViewer({
        session, manifest, showDeleted: true, onRemoveEdit: undefined,
      });
      expect(container.querySelector('.session-viewer__deleted-ghost')).not.toBeNull();
      expect(screen.queryByText('Restore')).not.toBeInTheDocument();
    });
  });
});
