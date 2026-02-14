import { useState, type ReactNode } from 'react';

interface Props {
  summary: string;
  count: number;
  children?: ReactNode;
}

export function ClaudeCollapsedGroup({ summary, count, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="claude-collapsed">
      <button
        className="claude-collapsed__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className={`claude-collapsed__toggle${expanded ? ' claude-collapsed__toggle--expanded' : ''}`} aria-hidden="true">{'\u25B6'}</span>
        <span className="claude-collapsed__summary">{summary}</span>
        <span className="claude-collapsed__count">({count})</span>
      </button>
      {expanded && children && (
        <div className="claude-collapsed__content">{children}</div>
      )}
    </div>
  );
}
