import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  PersonIcon,
  CopilotIcon,
  TerminalIcon,
  SearchIcon,
} from '@primer/octicons-react';
import type { Message, ContentBlock as ContentBlockType, ToolResult, PatchFile, PatchHunk } from '../../session/types';
import { CodeBlock } from '../../shared/CodeBlock';
import { MarkdownContent } from '../../shared/MarkdownContent';
import { toolSummary, guessLanguage } from '../../shared/toolUtils';
import { countDiffStats } from '../../shared/diffUtils';
import { formatTime } from '../../shared/formatUtils';
import { useBulkCollapse } from '../../session/BulkCollapseContext';

interface Props {
  message: Message;
}

/** Map internal tool names to user-facing names matching VS Code Copilot pattern */
function userFacingToolName(name: string): string {
  switch (name) {
    case 'Edit': return 'Update';
    case 'Grep': return 'Search';
    case 'Glob': return 'Search';
    case 'WebFetch': return 'Fetch';
    case 'WebSearch': return 'Search';
    default: return name;
  }
}

/** Pick an Octicon based on tool type */
function toolIcon(name: string) {
  switch (name) {
    case 'Bash':
      return <TerminalIcon size={14} />;
    case 'Grep':
    case 'Glob':
    case 'WebSearch':
      return <SearchIcon size={14} />;
    default:
      return <FileIcon size={14} />;
  }
}

function CopilotThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 150).replace(/\n/g, ' ');

  return (
    <div className="copilot-thinking">
      <button className="copilot-thinking__header" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        <span className="copilot-thinking__label">
          Thinking
          {!expanded && (
            <span className="copilot-thinking__dots">
              <span className="copilot-thinking__dot" />
              <span className="copilot-thinking__dot" />
              <span className="copilot-thinking__dot" />
            </span>
          )}
        </span>
        {!expanded && <span className="copilot-thinking__preview">{preview}...</span>}
      </button>
      {expanded && (
        <div className="copilot-thinking__body">
          <pre className="copilot-thinking__content">{content}</pre>
        </div>
      )}
    </div>
  );
}

function CopilotToolUseBlock({ block }: { block: ContentBlockType }) {
  const [expanded, setExpanded] = useState(false);
  const name = block.name || 'unknown';
  const input = block.input || {};
  const summary = toolSummary(name, input);
  const displayName = userFacingToolName(name);

  return (
    <div className="copilot-tool">
      <button
        className="copilot-tool__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="copilot-tool__icon">{toolIcon(name)}</span>
        <span className="copilot-tool__name">Used {displayName}</span>
        {summary && <span className="copilot-tool__summary">{summary}</span>}
        <span className="copilot-tool__toggle">
          {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        </span>
      </button>
      {expanded && (
        <div className="copilot-tool__body">
          {name === 'Bash' && Boolean(input.command) && (
            <CodeBlock code={String(input.command)} language="bash" />
          )}
          {(name === 'Read' || name === 'Write' || name === 'Edit') && (
            <div className="copilot-tool__detail">
              <div className="copilot-tool__filepath">{String(input.file_path || '')}</div>
              {name === 'Edit' && Boolean(input.old_string) && (
                <div className="copilot-tool__edit">
                  <div className="copilot-tool__edit-label">Replace:</div>
                  <CodeBlock code={String(input.old_string)} language="text" isError />
                  <div className="copilot-tool__edit-label">With:</div>
                  <CodeBlock code={String(input.new_string || '')} language="text" />
                </div>
              )}
              {name === 'Write' && Boolean(input.content) && (
                <CodeBlock
                  code={String(input.content).slice(0, 3000)}
                  language={guessLanguage(String(input.file_path || ''))}
                />
              )}
            </div>
          )}
          {name === 'Glob' && (
            <div className="copilot-tool__detail">
              Pattern: <code>{String(input.pattern || '')}</code>
              {input.path ? <>{' '}in <code>{String(input.path)}</code></> : null}
            </div>
          )}
          {name === 'Grep' && (
            <div className="copilot-tool__detail">
              Pattern: <code>{String(input.pattern || '')}</code>
              {input.path ? <>{' '}in <code>{String(input.path)}</code></> : null}
              {input.glob ? <>{' '}matching <code>{String(input.glob)}</code></> : null}
            </div>
          )}
          {!['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'].includes(name) && (
            <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
          )}
        </div>
      )}
    </div>
  );
}

function CopilotToolResultDisplay({ result }: { result: ToolResult }) {
  const r = result.result;

  if (r?.stdout || r?.stderr) {
    return (
      <div className="copilot-tool-result">
        {r.stdout && <CodeBlock code={r.stdout} language="text" />}
        {r.stderr && <CodeBlock code={r.stderr} language="text" isError />}
      </div>
    );
  }

  if (r?.type === 'text' || r?.type === 'create' || r?.type === 'update') {
    return <CopilotFileChange result={r} />;
  }

  if (r?.filenames) {
    return (
      <div>
        <div className="copilot-tool-result__count">{r.numFiles} file(s) found</div>
        <CodeBlock code={r.filenames.join('\n')} language="text" />
      </div>
    );
  }

  if (result.content) {
    const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    const truncated = content.length > 2000 ? content.slice(0, 2000) + '\n... (truncated)' : content;
    return <CodeBlock code={truncated} language="text" />;
  }

  return null;
}

function CopilotDiffBlock({ patches }: { patches: PatchFile[] }) {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  const toggleFile = (index: number) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="copilot-diff">
      {patches.map((file, fi) => {
        const { added, removed } = countDiffStats([file]);
        const isExpanded = expandedFiles.has(fi);
        return (
          <div key={fi}>
            <button
              className="copilot-diff__header"
              onClick={() => toggleFile(fi)}
              aria-expanded={isExpanded}
            >
              <span className="copilot-diff__toggle">
                {isExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
              </span>
              <span className="copilot-diff__path">{file.newFileName || file.oldFileName}</span>
              {added > 0 && <span className="copilot-diff__added">+{added}</span>}
              {removed > 0 && <span className="copilot-diff__removed">-{removed}</span>}
            </button>
            {isExpanded && (
              <div className="copilot-diff__hunks">
                {Array.isArray(file.hunks) && file.hunks.map((hunk, hi) => (
                  <CopilotDiffHunk key={hi} hunk={hunk} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CopilotDiffHunk({ hunk }: { hunk: PatchHunk }) {
  const lines: { type: string; content: string; oldLine?: number; newLine?: number }[] = [];

  if (hunk.changes) {
    for (const c of hunk.changes) {
      lines.push({ type: c.type, content: c.content, oldLine: c.oldLine, newLine: c.newLine });
    }
  } else if (hunk.lines) {
    for (const line of hunk.lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        lines.push({ type: 'add', content: line.slice(1) });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        lines.push({ type: 'del', content: line.slice(1) });
      } else {
        lines.push({ type: 'normal', content: line.startsWith(' ') ? line.slice(1) : line });
      }
    }
  }

  if (lines.length === 0) return null;

  return (
    <div className="copilot-diff__hunk">
      <div className="copilot-diff__hunk-header">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`copilot-diff__line copilot-diff__line--${line.type === 'add' ? 'added' : line.type === 'del' || line.type === 'remove' ? 'removed' : 'normal'}`}
        >
          <span className="copilot-diff__line-prefix">
            {line.type === 'add' ? '+' : line.type === 'del' || line.type === 'remove' ? '-' : ' '}
          </span>
          <span className="copilot-diff__line-content">{line.content}</span>
        </div>
      ))}
    </div>
  );
}

function CopilotFileChange({ result }: { result: NonNullable<ToolResult['result']> }) {
  const filePath = result.filePath || '';
  const shortPath = filePath.split(/[/\\]/).slice(-3).join('/');

  // If we have structured patch data, render the diff
  if (result.structuredPatch && result.structuredPatch.length > 0) {
    const { added, removed } = countDiffStats(result.structuredPatch);
    return (
      <div className="copilot-file-change copilot-file-change--diff">
        <FileIcon size={14} />
        <span className="copilot-file-change__path">{shortPath}</span>
        {added > 0 && <span className="copilot-diff__added">+{added}</span>}
        {removed > 0 && <span className="copilot-diff__removed">-{removed}</span>}
        <CopilotDiffBlock patches={result.structuredPatch} />
      </div>
    );
  }

  // Fallback: badge indicator
  let labelText = 'Read';
  let badgeClass = 'copilot-file-change__badge--read';
  if (result.type === 'create') { labelText = 'Created'; badgeClass = 'copilot-file-change__badge--create'; }
  else if (result.type === 'update') { labelText = 'Updated'; badgeClass = 'copilot-file-change__badge--update'; }

  return (
    <div className="copilot-file-change">
      <FileIcon size={14} />
      <span className={`copilot-file-change__badge ${badgeClass}`}>{labelText}</span>
      <span className="copilot-file-change__path">{shortPath}</span>
    </div>
  );
}

function AssistantBlock({ block }: { block: ContentBlockType }) {
  const { hideThinking } = useBulkCollapse();
  if (hideThinking && block.type === 'thinking') return null;

  switch (block.type) {
    case 'text':
      return <MarkdownContent content={block.text || ''} />;
    case 'thinking':
      return <CopilotThinkingBlock content={block.thinking || ''} />;
    case 'tool_use':
      return <CopilotToolUseBlock block={block} />;
    default:
      return null;
  }
}

export function CopilotMessageBlock({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`copilot-message copilot-message--${message.role}`}>
      <div className="copilot-message__avatar">
        <div className={`copilot-message__avatar-icon copilot-message__avatar-icon--${message.role}`}>
          {isUser ? <PersonIcon size={16} /> : <CopilotIcon size={16} />}
        </div>
      </div>
      <div className="copilot-message__content">
        <div className="copilot-message__header">
          <span className="copilot-message__role">
            {isUser ? 'You' : 'Copilot'}
          </span>
          {message.timestamp && (
            <span className="copilot-message__time">{formatTime(message.timestamp)}</span>
          )}
        </div>
        <div className="copilot-message__body">
          {isUser ? (
            <CopilotUserContent message={message} />
          ) : (
            message.blocks?.map((block, i) => (
              <AssistantBlock key={i} block={block} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CopilotUserContent({ message }: { message: Message }) {
  if (message.textContent) {
    return <MarkdownContent content={message.textContent} />;
  }

  if (message.toolResults && message.toolResults.length > 0) {
    return (
      <div className="copilot-tool-results">
        {message.toolResults.map((tr, i) => (
          <CopilotToolResultDisplay key={i} result={tr} />
        ))}
      </div>
    );
  }

  return <span className="copilot-message__empty">(empty message)</span>;
}
