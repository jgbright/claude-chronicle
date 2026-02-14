import { useState, type ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@primer/octicons-react';

interface Props {
  summary: string;
  count: number;
  children?: ReactNode;
}

export function CopilotCollapsedGroup({ summary, count, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="copilot-collapsed">
      <button className="copilot-collapsed__header" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
        <span className="copilot-collapsed__summary">{summary}</span>
        <span className="copilot-collapsed__count">{count} items</span>
      </button>
      {expanded && children && (
        <div className="copilot-collapsed__content">{children}</div>
      )}
    </div>
  );
}
