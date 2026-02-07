import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@primer/octicons-react';

interface Props {
  summary: string;
  count: number;
}

export function CopilotCollapsedGroup({ summary, count }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="copilot-collapsed" onClick={() => setExpanded(!expanded)}>
      {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
      <span className="copilot-collapsed__summary">{summary}</span>
      <span className="copilot-collapsed__count">{count} items</span>
    </div>
  );
}
