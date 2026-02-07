import { useState } from 'react';

interface Props {
  summary: string;
  count: number;
}

export function ClaudeCollapsedGroup({ summary, count }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="claude-collapsed" onClick={() => setExpanded(!expanded)}>
      <span className="claude-collapsed__toggle">{expanded ? '[-]' : '[+]'}</span>
      <span className="claude-collapsed__summary">{summary}</span>
      <span className="claude-collapsed__count">({count})</span>
    </div>
  );
}
