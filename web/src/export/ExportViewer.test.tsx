import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportViewer } from './ExportViewer';
import { createParsedSession, createManifest, createMessage } from '../test/factories';

describe('ExportViewer', () => {
  it('renders error message when data is null', () => {
    render(<ExportViewer data={null} />);
    expect(screen.getByText('No session data found')).toBeInTheDocument();
  });

  it('renders error message when data is falsy', () => {
    const { container } = render(<ExportViewer data={0 as unknown} />);
    expect(container.querySelector('.app__error')).not.toBeNull();
    expect(container.querySelector('.app__error')!.textContent).toBe('No session data found');
  });

  it('renders Chronicle brand', () => {
    const data = {
      session: createParsedSession(),
      manifest: null,
      theme: 'claude',
    };
    render(<ExportViewer data={data} />);
    const brands = screen.getAllByText('Chronicle');
    expect(brands.length).toBeGreaterThan(0);
  });

  it('renders project name from session info', () => {
    const data = {
      session: createParsedSession({
        info: {
          id: 's1',
          projectDir: '/proj',
          projectName: 'Test Project',
          filePath: '/path',
          modTime: '2025-01-01T00:00:00Z',
          sizeBytes: 100,
        },
      }),
      manifest: null,
      theme: 'claude',
    };
    render(<ExportViewer data={data} />);
    const titles = screen.getAllByText('Test Project');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders session viewer with messages', () => {
    const data = {
      session: createParsedSession(),
      manifest: createManifest(),
      theme: 'copilot',
    };
    const { container } = render(<ExportViewer data={data} />);
    expect(container.querySelector('.session-viewer')).not.toBeNull();
  });

  it('renders with manifest edits applied', () => {
    const session = createParsedSession({
      messages: [
        {
          id: 'msg-keep',
          role: 'user',
          timestamp: '2025-01-01T00:00:00Z',
          textContent: 'Visible message',
        },
        {
          id: 'msg-del',
          role: 'assistant',
          timestamp: '2025-01-01T00:00:01Z',
          blocks: [{ type: 'text', text: 'Deleted message' }],
        },
      ],
    });
    const manifest = createManifest({
      edits: [{ type: 'delete', blockId: 'msg-del' }],
    });
    const data = { session, manifest, theme: 'claude' };
    render(<ExportViewer data={data} />);
    expect(screen.getByText('Visible message')).toBeInTheDocument();
    expect(screen.queryByText('Deleted message')).not.toBeInTheDocument();
  });

  it('renders without manifest', () => {
    const session = createParsedSession({
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          timestamp: '2025-01-01T00:00:00Z',
          textContent: 'User says hi',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          timestamp: '2025-01-01T00:00:01Z',
          blocks: [{ type: 'text', text: 'Assistant replies' }],
        },
      ],
    });
    const data = { session, manifest: null, theme: 'claude' };
    render(<ExportViewer data={data} />);
    expect(screen.getByText('User says hi')).toBeInTheDocument();
    expect(screen.getByText('Assistant replies')).toBeInTheDocument();
  });

  it('does not render message actions in export (read-only)', () => {
    const data = {
      session: createParsedSession(),
      manifest: createManifest(),
      theme: 'claude',
    };
    const { container } = render(<ExportViewer data={data} />);
    expect(container.querySelector('.edit-controls')).toBeNull();
    expect(container.querySelectorAll('.message-actions').length).toBe(0);
  });

  it('renders theme toggle buttons (Claude and Copilot)', () => {
    const data = {
      session: createParsedSession(),
      manifest: null,
      theme: 'claude',
    };
    const { container } = render(<ExportViewer data={data} />);
    const themeButtons = container.querySelectorAll('.toolbar__theme-btn');
    expect(themeButtons).toHaveLength(2);
  });

  it('renders the toolbar right section with controls', () => {
    const data = {
      session: createParsedSession(),
      manifest: null,
      theme: 'claude',
    };
    const { container } = render(<ExportViewer data={data} />);
    expect(container.querySelector('.toolbar__right')).not.toBeNull();
  });

  it('does not render Undo and Redo in toolbar (read-only)', () => {
    const data = {
      session: createParsedSession(),
      manifest: null,
      theme: 'claude',
    };
    render(<ExportViewer data={data} />);
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    expect(screen.queryByText('Redo')).not.toBeInTheDocument();
  });

  it('sets data-theme attribute on documentElement based on export data', () => {
    const data = {
      session: createParsedSession(),
      manifest: null,
      theme: 'copilot',
    };
    render(<ExportViewer data={data} />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('copilot');
  });

  it('renders annotations without Remove button in export', () => {
    const session = createParsedSession({
      messages: [createMessage({ id: 'a1' })],
    });
    const manifest = createManifest({
      edits: [
        { type: 'annotate', afterBlockId: 'a1', content: 'Export annotation', id: 'ann-1' },
      ],
    });
    const data = { session, manifest, theme: 'claude' };
    const { container } = render(<ExportViewer data={data} />);
    expect(container.querySelector('.claude-annotation')).not.toBeNull();
    expect(container.querySelector('.claude-annotation__delete')).toBeNull();
  });
});
