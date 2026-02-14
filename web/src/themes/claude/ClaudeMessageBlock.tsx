import { useState } from 'react';
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

/** Map internal tool names to user-facing names matching Claude Code CLI */
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

function ClaudeThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 120).replace(/\n/g, ' ');

  return (
    <div className="claude-thinking">
      <button className="claude-thinking__header" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span className="claude-thinking__symbol" aria-hidden="true">{'\u273B'}</span>
        <span className="claude-thinking__label">
          {expanded ? 'Thinking' : 'Thinking...'}
        </span>
        {!expanded && <span className="claude-thinking__preview">{preview}</span>}
      </button>
      {expanded && (
        <div className="claude-thinking__body">
          <pre className="claude-thinking__content">{content}</pre>
        </div>
      )}
    </div>
  );
}

function ClaudeTextBlock({ content }: { content: string }) {
  return (
    <div className="claude-text-block">
      <span className="claude-text-block__dot" aria-hidden="true">{'\u25CF'}</span>
      <div className="claude-text-block__content">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}

function ClaudeToolUseBlock({ block }: { block: ContentBlockType }) {
  const [expanded, setExpanded] = useState(false);
  const name = block.name || 'unknown';
  const input = block.input || {};
  const summary = toolSummary(name, input);
  const displayName = userFacingToolName(name);

  return (
    <div className="claude-tool">
      <button
        className="claude-tool__header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="claude-tool__dot claude-tool__dot--resolved" aria-hidden="true">{'\u25CF'}</span>
        <span className="claude-tool__label">
          <span className="claude-tool__name">{displayName}</span>
          {summary && <span className="claude-tool__summary">({summary})</span>}
        </span>
      </button>
      {expanded && (
        <div className="claude-tool__body">
          {name === 'Bash' && Boolean(input.command) && (
            <CodeBlock code={String(input.command)} language="bash" />
          )}
          {(name === 'Read' || name === 'Write' || name === 'Edit') && (
            <div className="claude-tool__detail">
              <div className="claude-tool__filepath">{String(input.file_path || '')}</div>
              {name === 'Edit' && Boolean(input.old_string) && (
                <div className="claude-tool__edit">
                  <div className="claude-tool__edit-label">Replace:</div>
                  <CodeBlock code={String(input.old_string)} language="text" isError />
                  <div className="claude-tool__edit-label">With:</div>
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
            <div className="claude-tool__detail">
              Pattern: <code>{String(input.pattern || '')}</code>
              {input.path ? <>{' '}in <code>{String(input.path)}</code></> : null}
            </div>
          )}
          {name === 'Grep' && (
            <div className="claude-tool__detail">
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

function ClaudeToolResultInner({ result }: { result: ToolResult }) {
  const r = result.result;

  if (r?.stdout || r?.stderr) {
    return (
      <div className="claude-tool-result">
        {r.stdout && (
          <pre className="claude-tool-result__stdout">{r.stdout}</pre>
        )}
        {r.stderr && (
          <pre className="claude-tool-result__stderr">{r.stderr}</pre>
        )}
      </div>
    );
  }

  if (r?.type === 'text' || r?.type === 'create' || r?.type === 'update') {
    return <ClaudeFileChange result={r} />;
  }

  if (r?.filenames) {
    return (
      <div className="claude-tool-result">
        <pre className="claude-tool-result__stdout">
          {`${r.numFiles} file(s) found\n${r.filenames.join('\n')}`}
        </pre>
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

function ClaudeToolResultDisplay({ result }: { result: ToolResult }) {
  return (
    <div className="claude-tool-result--branched">
      <span className="claude-tool-result__branch" aria-hidden="true">{'\u23BF'}</span>
      <div className="claude-tool-result__content">
        <ClaudeToolResultInner result={result} />
      </div>
    </div>
  );
}

function ClaudeDiffBlock({ patches }: { patches: PatchFile[] }) {
  const [expanded, setExpanded] = useState(false);
  const { added, removed } = countDiffStats(patches);

  return (
    <div className="claude-diff">
      {patches.map((file, fi) => (
        <div key={fi}>
          <button className="claude-diff__header" onClick={() => setExpanded(!expanded)}>
            <span className="claude-diff__toggle">{expanded ? '\u25BC' : '\u25B6'}</span>
            <span className="claude-diff__path">{file.newFileName || file.oldFileName}</span>
            {added > 0 && <span className="claude-diff__added">+{added}</span>}
            {removed > 0 && <span className="claude-diff__removed">-{removed}</span>}
          </button>
          {expanded && (
            <div className="claude-diff__hunks">
              {Array.isArray(file.hunks) && file.hunks.map((hunk, hi) => (
                <ClaudeDiffHunk key={hi} hunk={hunk} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ClaudeDiffHunk({ hunk }: { hunk: PatchHunk }) {
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
    <div className="claude-diff__hunk">
      <div className="claude-diff__hunk-header">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`claude-diff__line claude-diff__line--${line.type === 'add' ? 'added' : line.type === 'del' || line.type === 'remove' ? 'removed' : 'normal'}`}
        >
          <span className="claude-diff__line-prefix">
            {line.type === 'add' ? '+' : line.type === 'del' || line.type === 'remove' ? '-' : ' '}
          </span>
          <span className="claude-diff__line-content">{line.content}</span>
        </div>
      ))}
    </div>
  );
}

function ClaudeFileChange({ result }: { result: NonNullable<ToolResult['result']> }) {
  const filePath = result.filePath || '';
  const shortPath = filePath.split(/[/\\]/).slice(-3).join('/');

  // If we have structured patch data, render the diff
  if (result.structuredPatch && result.structuredPatch.length > 0) {
    const { added, removed } = countDiffStats(result.structuredPatch);
    return (
      <div className="claude-file-change">
        <span className="claude-file-change__path">{shortPath}</span>
        {added > 0 && <span className="claude-diff__added">+{added}</span>}
        {removed > 0 && <span className="claude-diff__removed">-{removed}</span>}
        <ClaudeDiffBlock patches={result.structuredPatch} />
      </div>
    );
  }

  // Fallback: simple indicator
  let tag = 'read';
  if (result.type === 'create') tag = 'new';
  else if (result.type === 'update') tag = 'mod';

  const dotClass = tag === 'new' ? 'claude-tool__dot--resolved' : tag === 'mod' ? 'claude-tool__dot--resolved' : '';

  return (
    <div className="claude-file-change">
      <span className={`claude-tool__dot ${dotClass}`}>{'\u25CF'}</span>
      <span className="claude-file-change__path">{shortPath}</span>
    </div>
  );
}

function AssistantBlock({ block }: { block: ContentBlockType }) {
  const { hideThinking } = useBulkCollapse();
  if (hideThinking && block.type === 'thinking') return null;

  switch (block.type) {
    case 'text':
      return <ClaudeTextBlock content={block.text || ''} />;
    case 'thinking':
      return <ClaudeThinkingBlock content={block.thinking || ''} />;
    case 'tool_use':
      return <ClaudeToolUseBlock block={block} />;
    default:
      return null;
  }
}

/** Tool-result-only user messages render inline without a ❯ prompt, matching the real CLI */
function isToolResultOnlyMessage(message: Message): boolean {
  return message.role === 'user' && !message.textContent
    && Boolean(message.toolResults && message.toolResults.length > 0);
}

export function ClaudeMessageBlock({ message }: Props) {
  if (isToolResultOnlyMessage(message)) {
    return (
      <div className="claude-message claude-message--tool-results">
        <div className="claude-message__body">
          {message.toolResults?.map((tr, i) => (
            <ClaudeToolResultDisplay key={i} result={tr} />
          ))}
        </div>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="claude-message claude-message--user">
        <span className="claude-message__prompt claude-message__prompt--user">{'\u276F'}</span>
        <span className="claude-message__user-text">
          <MarkdownContent content={message.textContent || ''} />
        </span>
      </div>
    );
  }

  return (
    <div className="claude-message claude-message--assistant">
      <div className="claude-message__body">
        {message.blocks?.map((block, i) => (
          <AssistantBlock key={i} block={block} />
        ))}
        {message.timestamp && (
          <span className="claude-message__time">{formatTime(message.timestamp)}</span>
        )}
      </div>
    </div>
  );
}

