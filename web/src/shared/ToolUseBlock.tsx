import { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { toolSummary, guessLanguage } from './toolUtils';

interface Props {
  toolName: string;
  toolId: string;
  input: Record<string, unknown>;
}

export function ToolUseBlock({ toolName, input }: Props) {
  const [expanded, setExpanded] = useState(false);
  const summary = toolSummary(toolName, input);

  return (
    <div className="tool-use">
      <button className="tool-use__header" onClick={() => setExpanded(!expanded)}>
        <span className="tool-use__icon">
          {expanded ? '\u25BE' : '\u25B8'}
        </span>
        <span className="tool-use__name">{toolName}</span>
        {summary && <span className="tool-use__summary">{summary}</span>}
      </button>
      {expanded && (
        <div className="tool-use__body">
          {toolName === 'Bash' && Boolean(input.command) && (
            <CodeBlock code={String(input.command)} language="bash" />
          )}
          {(toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') && (
            <div className="tool-use__detail">
              <div className="tool-use__filepath">{String(input.file_path || '')}</div>
              {toolName === 'Edit' && Boolean(input.old_string) && (
                <div className="tool-use__edit">
                  <div className="tool-use__edit-label">Replace:</div>
                  <CodeBlock code={String(input.old_string)} language="text" isError />
                  <div className="tool-use__edit-label">With:</div>
                  <CodeBlock code={String(input.new_string || '')} language="text" />
                </div>
              )}
              {toolName === 'Write' && Boolean(input.content) && (
                <CodeBlock
                  code={String(input.content).slice(0, 3000)}
                  language={guessLanguage(String(input.file_path || ''))}
                />
              )}
            </div>
          )}
          {toolName === 'Glob' && (
            <div className="tool-use__detail">
              Pattern: <code>{String(input.pattern || '')}</code>
              {input.path ? <>{' '}in <code>{String(input.path)}</code></> : null}
            </div>
          )}
          {toolName === 'Grep' && (
            <div className="tool-use__detail">
              Pattern: <code>{String(input.pattern || '')}</code>
              {input.path ? <>{' '}in <code>{String(input.path)}</code></> : null}
              {input.glob ? <>{' '}matching <code>{String(input.glob)}</code></> : null}
            </div>
          )}
          {!['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'].includes(toolName) && (
            <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
          )}
        </div>
      )}
    </div>
  );
}
