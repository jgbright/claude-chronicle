import { useState, useRef, useEffect } from 'react';
import type { SessionInfo } from './types';
import { formatSize, formatDate } from '../shared/formatUtils';

interface Props {
  sessions: SessionInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRename?: (id: string) => void;
  onExport?: (id: string) => void;
}

function SessionMenu({ sessionId, isDeleted, onDelete, onRestore, onRename, onExport, onClose }: {
  sessionId: string;
  isDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRename?: (id: string) => void;
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
              onClick={(e) => { e.stopPropagation(); onRename(sessionId); onClose(); }}
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

  const activeSessions = sessions.filter((s) => !s.deleted);
  const archivedSessions = sessions.filter((s) => s.deleted);

  const renderItem = (s: SessionInfo) => (
    <div
      key={s.id}
      className={`session-list__item-wrapper ${s.deleted ? 'session-list__item--deleted' : ''}`}
    >
      <button
        className={`session-list__item ${s.id === selectedId ? 'session-list__item--selected' : ''}`}
        onClick={() => onSelect(s.id)}
      >
        {s.title ? (
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
            onRename={onRename}
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
        <>
          <div className="session-list__items">
            {activeSessions.map(renderItem)}
          </div>
          {archivedSessions.length > 0 && (
            <ArchivedSection>
              {archivedSessions.map(renderItem)}
            </ArchivedSection>
          )}
        </>
      )}
    </div>
  );
}

function ArchivedSection({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="session-list__archived">
      <button
        className="session-list__archived-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="session-list__archived-icon">{expanded ? '\u25BE' : '\u25B8'}</span>
        Hidden
      </button>
      {expanded && <div className="session-list__items">{children}</div>}
    </div>
  );
}
