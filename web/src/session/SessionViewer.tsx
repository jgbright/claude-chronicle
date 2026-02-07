import { useMemo, useState } from 'react';
import type { ParsedSession } from './types';
import type { EditManifest, Edit } from '../manifest/types';
import { EditControls } from './EditControls';
import { useThemeComponents } from '../themes/ThemeContext';
import { applyManifest } from '../manifest/sessionTransform';
import { useUndoRedoKeys } from '../manifest/useUndoRedoKeys';

interface Props {
  session: ParsedSession;
  manifest: EditManifest | null;
  editMode: boolean;
  onAddEdit: (edit: Edit) => void;
  onRemoveEdit: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function SessionViewer({
  session, manifest, editMode, onAddEdit, onRemoveEdit,
  onUndo = () => {}, onRedo = () => {},
  canUndo = false, canRedo = false,
}: Props) {
  const { MessageBlock, AnnotationBlock, CollapsedGroup } = useThemeComponents();
  const [showDeleted, setShowDeleted] = useState(false);

  useUndoRedoKeys({ onUndo, onRedo, enabled: editMode });

  const transformed = useMemo(
    () => applyManifest(session.messages, manifest, { showDeleted: editMode && showDeleted }),
    [session.messages, manifest, editMode, showDeleted]
  );

  const handleDelete = (messageId: string) => {
    onAddEdit({ type: 'delete', blockId: messageId });
  };

  const handleAnnotate = (afterBlockId: string, content: string) => {
    onAddEdit({
      type: 'annotate',
      afterBlockId,
      content,
      id: `annotation-${Date.now()}`,
    });
  };

  const handleRestore = (blockId: string) => {
    if (!manifest) return;
    const idx = manifest.edits.findIndex(
      (e) => e.type === 'delete' && e.blockId === blockId
    );
    if (idx >= 0) onRemoveEdit(idx);
  };

  return (
    <div className="session-viewer">
      <div className="session-viewer__info">
        <span className="session-viewer__project">{session.info.projectName}</span>
        <span className="session-viewer__count">
          {transformed.length} messages
          {manifest && manifest.edits.length > 0 && (
            <> ({manifest.edits.length} edits applied)</>
          )}
        </span>
      </div>

      {editMode && (
        <BulkActions
          messages={session.messages}
          manifest={manifest}
          onAddEdit={onAddEdit}
          onRemoveEdit={onRemoveEdit}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          showDeleted={showDeleted}
          onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        />
      )}

      <div className="session-viewer__messages">
        {transformed.map((msg, i) => {
          if (msg.isCollapsed) {
            return (
              <CollapsedGroup
                key={msg.id || i}
                summary={msg.collapseSummary || ''}
                count={msg.collapsedCount || 0}
              />
            );
          }

          if (msg.isAnnotation) {
            return (
              <AnnotationBlock
                key={msg.id || i}
                content={msg.textContent || ''}
                editMode={editMode}
                onDelete={() => {
                  // Find and remove the annotation edit
                  if (manifest) {
                    const idx = manifest.edits.findIndex(
                      (e) => e.type === 'annotate' && e.id === msg.id
                    );
                    if (idx >= 0) onRemoveEdit(idx);
                  }
                }}
              />
            );
          }

          if (msg.isDeleted) {
            return (
              <div key={msg.id || i} className="session-viewer__deleted-ghost">
                <MessageBlock message={msg} />
                <button
                  className="session-viewer__restore-btn"
                  onClick={() => handleRestore(msg.id)}
                >
                  Restore
                </button>
              </div>
            );
          }

          return (
            <div key={msg.id || i}>
              <MessageBlock message={msg} />
              {editMode && (
                <EditControls
                  messageId={msg.id}
                  onDelete={handleDelete}
                  onAnnotate={handleAnnotate}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

interface BulkActionsProps {
  messages: ParsedSession['messages'];
  manifest: EditManifest | null;
  onAddEdit: (edit: Edit) => void;
  onRemoveEdit: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showDeleted: boolean;
  onToggleShowDeleted: () => void;
}

function BulkActions({
  messages, manifest, onAddEdit, onRemoveEdit,
  onUndo, onRedo, canUndo, canRedo,
  showDeleted, onToggleShowDeleted,
}: BulkActionsProps) {
  const collapseAllThinking = () => {
    const thinkingIds: string[] = [];
    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.blocks) {
        const hasThinking = msg.blocks.some((b) => b.type === 'thinking');
        const hasOnlyThinking = msg.blocks.every((b) => b.type === 'thinking');
        if (hasThinking && hasOnlyThinking) {
          thinkingIds.push(msg.id);
        }
      }
    }
    if (thinkingIds.length === 0) return;

    // Toggle: if a matching collapse already exists, remove it
    if (manifest) {
      const idx = manifest.edits.findIndex(
        (e) => e.type === 'collapse' && arraysEqual(e.blockIds, thinkingIds)
      );
      if (idx >= 0) {
        onRemoveEdit(idx);
        return;
      }
    }

    onAddEdit({
      type: 'collapse',
      blockIds: thinkingIds,
      summary: `${thinkingIds.length} thinking blocks`,
    });
  };

  const collapseToolResults = () => {
    const toolResultIds: string[] = [];
    for (const msg of messages) {
      if (msg.role === 'user' && msg.toolResults && msg.toolResults.length > 0) {
        toolResultIds.push(msg.id);
      }
    }
    if (toolResultIds.length === 0) return;

    // Toggle: if a matching collapse already exists, remove it
    if (manifest) {
      const idx = manifest.edits.findIndex(
        (e) => e.type === 'collapse' && arraysEqual(e.blockIds, toolResultIds)
      );
      if (idx >= 0) {
        onRemoveEdit(idx);
        return;
      }
    }

    onAddEdit({
      type: 'collapse',
      blockIds: toolResultIds,
      summary: `${toolResultIds.length} tool results`,
    });
  };

  return (
    <div className="bulk-actions">
      <button className="bulk-actions__btn" onClick={collapseAllThinking}>
        Collapse all thinking
      </button>
      <button className="bulk-actions__btn" onClick={collapseToolResults}>
        Collapse all tool results
      </button>
      <button
        className={`bulk-actions__btn${showDeleted ? ' bulk-actions__btn--active' : ''}`}
        onClick={onToggleShowDeleted}
      >
        Show deleted
      </button>
      <span className="bulk-actions__separator" />
      <button
        className="bulk-actions__btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        className="bulk-actions__btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>
    </div>
  );
}
