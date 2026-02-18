import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import type { ParsedSession } from './types';
import type { EditManifest, Edit } from '../manifest/types';
import { MessageActions } from './MessageActions';
import { useThemeComponents } from '../themes/ThemeContext';
import { applyManifest } from '../manifest/sessionTransform';
import { useUndoRedoKeys } from '../manifest/useUndoRedoKeys';
import { revealSession } from '../manifest/api';
import { BulkCollapseProvider } from './BulkCollapseContext';

interface Props {
  session: ParsedSession;
  manifest: EditManifest | null;
  onAddEdit?: (edit: Edit) => void;
  onRemoveEdit?: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onUpdateTitle?: (title: string) => void;
  showDeleted?: boolean;
  collapseThinking?: boolean;
  collapseToolResults?: boolean;
  collapseFileReads?: boolean;
  onToast?: (message: string, onUndo?: () => void) => void;
}

export function SessionViewer({
  session, manifest, onAddEdit, onRemoveEdit,
  onUndo = () => {}, onRedo = () => {},
  onUpdateTitle,
  showDeleted = false,
  collapseThinking = false,
  collapseToolResults = false,
  collapseFileReads = false,
  onToast,
}: Props) {
  const { MessageBlock, AnnotationBlock, CollapsedGroup } = useThemeComponents();
  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const hasDeleteEdits = useMemo(
    () => !!manifest && manifest.edits.some((e) => e.type === 'delete'),
    [manifest]
  );

  const effectiveShowDeleted = showDeleted && hasDeleteEdits;

  useUndoRedoKeys({ onUndo, onRedo, enabled: true });

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(session.info.filePath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [session.info.filePath]);

  const handleReveal = useCallback(() => {
    revealSession(session.info.id).catch(() => {
      // Silently ignore — user may not have a file explorer available
    });
  }, [session.info.id]);

  const handleTitleClick = useCallback(() => {
    if (!onUpdateTitle) return;
    setTitleDraft(session.info.title || session.info.projectName || '');
    setEditingTitle(true);
  }, [onUpdateTitle, session.info.title, session.info.projectName]);

  const handleTitleSave = useCallback(() => {
    if (!onUpdateTitle) return;
    const trimmed = titleDraft.trim();
    onUpdateTitle(trimmed);
    setEditingTitle(false);
  }, [onUpdateTitle, titleDraft]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  }, [handleTitleSave]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const transformed = useMemo(
    () => applyManifest(session.messages, manifest, {
      showDeleted: effectiveShowDeleted,
      collapseAllToolResults: collapseToolResults,
      collapseReadResults: collapseFileReads,
    }),
    [session.messages, manifest, effectiveShowDeleted, collapseToolResults, collapseFileReads]
  );

  const handleHide = useCallback((messageId: string) => {
    if (!onAddEdit) return;
    onAddEdit({ type: 'delete', blockId: messageId });
    if (onToast) {
      onToast('Message hidden', () => onUndo());
    }
  }, [onAddEdit, onToast, onUndo]);

  const handleAnnotate = useCallback((afterBlockId: string, content: string) => {
    if (!onAddEdit) return;
    onAddEdit({
      type: 'annotate',
      afterBlockId,
      content,
      id: `annotation-${Date.now()}`,
    });
    if (onToast) {
      onToast('Annotation added');
    }
  }, [onAddEdit, onToast]);

  const handleRestore = useCallback((blockId: string) => {
    if (!manifest || !onRemoveEdit) return;
    const idx = manifest.edits.findIndex(
      (e) => e.type === 'delete' && e.blockId === blockId
    );
    if (idx >= 0) {
      onRemoveEdit(idx);
      if (onToast) {
        onToast('Message restored');
      }
    }
  }, [manifest, onRemoveEdit, onToast]);

  const handleRemoveAnnotation = useCallback((annotationId: string) => {
    if (!manifest || !onRemoveEdit) return;
    const idx = manifest.edits.findIndex(
      (e) => e.type === 'annotate' && e.id === annotationId
    );
    if (idx >= 0) {
      onRemoveEdit(idx);
      if (onToast) {
        onToast('Annotation removed', () => onRedo());
      }
    }
  }, [manifest, onRemoveEdit, onToast, onRedo]);

  const displayTitle = session.info.title || session.info.projectName;

  return (
    <div className="session-viewer">
      <div className="session-viewer__info">
        <div className="session-viewer__info-main">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="session-viewer__title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            <span
              className={`session-viewer__title${onUpdateTitle ? ' session-viewer__title--editable' : ''}`}
              onClick={handleTitleClick}
              title={onUpdateTitle ? 'Click to rename' : undefined}
            >
              {displayTitle}
              {onUpdateTitle && <span className="session-viewer__title-pencil">&nbsp;&#9998;</span>}
            </span>
          )}
          <span className="session-viewer__count">
            {transformed.length} messages
            {manifest && manifest.edits.length > 0 && (
              <> ({manifest.edits.length} edits applied)</>
            )}
          </span>
        </div>
        {session.info.title && session.info.projectName && (
          <div className="session-viewer__project-secondary">
            {session.info.projectName}
          </div>
        )}
        {session.info.filePath && (
          <div className="session-viewer__filepath">
            <span className="session-viewer__filepath-text" title={session.info.filePath}>
              {session.info.filePath}
            </span>
            <button
              className="session-viewer__copy-btn"
              onClick={handleCopyPath}
              title="Copy file path"
              aria-label="Copy file path"
            >
              {copied ? '\u2713' : '\u29C9'}
            </button>
            <button
              className="session-viewer__copy-btn"
              onClick={handleReveal}
              title="Open in File Explorer"
              aria-label="Open in File Explorer"
            >
              \u238B
            </button>
          </div>
        )}
      </div>

      <BulkCollapseProvider value={{ hideThinking: collapseThinking }}>
        <div className="session-viewer__messages">
          {transformed.map((msg, i) => {
            if (msg.isCollapsed) {
              return (
                <CollapsedGroup
                  key={msg.id || i}
                  summary={msg.collapseSummary || ''}
                  count={msg.collapsedCount || 0}
                >
                  {msg.collapsedMessages?.map((m, j) => (
                    <MessageBlock key={m.id || j} message={m} />
                  ))}
                </CollapsedGroup>
              );
            }

            if (msg.isAnnotation) {
              return (
                <AnnotationBlock
                  key={msg.id || i}
                  content={msg.textContent || ''}
                  onDelete={onRemoveEdit ? () => handleRemoveAnnotation(msg.id) : undefined}
                />
              );
            }

            if (msg.isDeleted) {
              return (
                <div key={msg.id || i} className="session-viewer__deleted-ghost">
                  <MessageBlock message={msg} />
                  {onRemoveEdit && (
                    <button
                      className="session-viewer__restore-btn"
                      onClick={() => handleRestore(msg.id)}
                    >
                      Restore
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={msg.id || i} className="message-actions-wrapper">
                <MessageBlock message={msg} />
                {onAddEdit && (
                  <MessageActions
                    messageId={msg.id}
                    onHide={handleHide}
                    onAnnotate={handleAnnotate}
                  />
                )}
              </div>
            );
          })}
        </div>
      </BulkCollapseProvider>
    </div>
  );
}
