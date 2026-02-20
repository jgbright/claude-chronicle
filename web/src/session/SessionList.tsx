import { useState, useRef, useEffect } from 'react';
import type { SessionInfo } from './types';
import { formatSize, formatDate } from '../shared/formatUtils';

interface Props {
  sessions: SessionInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onExport?: (id: string) => void;
}

function SessionMenu({ sessionId, isDeleted, onDelete, onRestore, onRename, onExport, onClose }: {
  sessionId: string;
  isDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRename?: () => void;
  onExport?: (id: string) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="session-menu" ref={menuRef} role="menu">
      {isDeleted ? (
        onRestore && (
          <button
            className="session-menu__item"
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onRestore(sessionId); onClose(); }}
          >
            Restore
          </button>
        )
      ) : (
        <>
          {onRename && (
            <button
              className="session-menu__item"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); onRename(); onClose(); }}
            >
              Rename
            </button>
          )}
          {onExport && (
            <button
              className="session-menu__item"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); onExport(sessionId); onClose(); }}
            >
              Export
            </button>
          )}
          {onDelete && (
            <button
              className="session-menu__item session-menu__item--danger"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); onDelete(sessionId); onClose(); }}
            >
              Hide
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SessionList({ sessions, selectedId, onSelect, onDelete, onRestore, onRename, onExport }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleRenameStart = (s: SessionInfo) => {
    setRenamingId(s.id);
    setRenameDraft(s.title || s.projectName || '');
  };

  const handleRenameSave = () => {
    if (renamingId && onRename) {
      onRename(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
  };

  const renderItem = (s: SessionInfo) => (
    <div
      key={s.id}
      className={`session-list__item-wrapper ${s.deleted ? 'session-list__item--deleted' : ''}`}
    >
      <button
        className={`session-list__item ${s.id === selectedId ? 'session-list__item--selected' : ''}`}
        onClick={() => onSelect(s.id)}
      >
        {renamingId === s.id ? (
          <input
            ref={renameInputRef}
            className="session-list__rename-input"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSave();
              else if (e.key === 'Escape') handleRenameCancel();
            }}
            onBlur={handleRenameSave}
            onClick={(e) => e.stopPropagation()}
          />
        ) : s.title ? (
          <>
            <div className="session-list__session-title">{s.title}</div>
            <div className="session-list__project-secondary">{s.projectName}</div>
          </>
        ) : (
          <div className="session-list__project">{s.projectName}</div>
        )}
        <div className="session-list__meta">
          <span>{formatDate(s.modTime)}</span>
          <span>{formatSize(s.sizeBytes)}</span>
        </div>
        <div className="session-list__id">{s.id.slice(0, 8)}...</div>
      </button>
      <div className="session-list__menu-anchor">
        <button
          className="session-list__menu-btn"
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id); }}
          title="Session actions"
          aria-label="Session actions"
          aria-expanded={openMenuId === s.id}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
        {openMenuId === s.id && (
          <SessionMenu
            sessionId={s.id}
            isDeleted={s.deleted}
            onDelete={onDelete}
            onRestore={onRestore}
            onRename={onRename ? () => handleRenameStart(s) : undefined}
            onExport={onExport}
            onClose={() => setOpenMenuId(null)}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="session-list">
      <h2 className="session-list__title">Sessions</h2>
      {sessions.length === 0 ? (
        <div className="session-list__empty">No sessions found</div>
      ) : (
        <div className="session-list__items">
          {sessions.map(renderItem)}
        </div>
      )}
    </div>
  );
}
