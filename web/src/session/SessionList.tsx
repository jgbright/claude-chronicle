import type { SessionInfo } from './types';
import { formatSize, formatDate } from '../shared/formatUtils';

interface Props {
  sessions: SessionInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SessionList({ sessions, selectedId, onSelect }: Props) {
  return (
    <div className="session-list">
      <h2 className="session-list__title">Sessions</h2>
      <div className="session-list__items">
        {sessions.map((s) => (
          <button
            key={s.id}
            className={`session-list__item ${s.id === selectedId ? 'session-list__item--selected' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <div className="session-list__project">{s.projectName}</div>
            <div className="session-list__meta">
              <span>{formatDate(s.modTime)}</span>
              <span>{formatSize(s.sizeBytes)}</span>
            </div>
            <div className="session-list__id">{s.id.slice(0, 8)}...</div>
          </button>
        ))}
      </div>
    </div>
  );
}
