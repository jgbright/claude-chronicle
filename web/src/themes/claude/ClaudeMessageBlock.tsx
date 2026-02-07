import { useState } from 'react';
import type { Message, ContentBlock as ContentBlockType, ToolResult } from '../../session/types';
import { ToolUseBlock } from '../../shared/ToolUseBlock';
import { CodeBlock } from '../../shared/CodeBlock';
import { MarkdownContent } from '../../shared/MarkdownContent';
import { formatTime } from '../../shared/formatUtils';

interface Props {
  message: Message;
}

function ClaudeThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 120).replace(/\n/g, ' ');

  return (
    <div className="claude-thinking">
      <button className="claude-thinking__header" onClick={() => setExpanded(!expanded)}>
        <span className="claude-thinking__toggle">{expanded ? '[-]' : '[+]'}</span>
        <span className="claude-thinking__label">thinking</span>
        {!expanded && <span className="claude-thinking__preview">{preview}...</span>}
      </button>
      {expanded && (
        <pre className="claude-thinking__content">{content}</pre>
      )}
    </div>
  );
}

function ClaudeToolUseBlock({ block }: { block: ContentBlockType }) {
  return (
    <ToolUseBlock
      toolName={block.name || 'unknown'}
      toolId={block.id || ''}
      input={block.input || {}}
    />
  );
}

function ClaudeToolResultDisplay({ result }: { result: ToolResult }) {
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

function ClaudeFileChange({ result }: { result: NonNullable<ToolResult['result']> }) {
  const filePath = result.filePath || '';
  const shortPath = filePath.split(/[/\\]/).slice(-3).join('/');

  let tag = '[READ]';
  if (result.type === 'create') tag = '[NEW]';
  else if (result.type === 'update') tag = '[MOD]';

  return (
    <div className="claude-file-change">
      <span className={`claude-file-change__tag claude-file-change__tag--${result.type === 'create' ? 'new' : result.type === 'update' ? 'mod' : 'read'}`}>
        {tag}
      </span>
      <span className="claude-file-change__path">{shortPath}</span>
    </div>
  );
}

function AssistantBlock({ block }: { block: ContentBlockType }) {
  switch (block.type) {
    case 'text':
      return <MarkdownContent content={block.text || ''} />;
    case 'thinking':
      return <ClaudeThinkingBlock content={block.thinking || ''} />;
    case 'tool_use':
      return <ClaudeToolUseBlock block={block} />;
    default:
      return null;
  }
}

export function ClaudeMessageBlock({ message }: Props) {
  const isUser = message.role === 'user';
  const prompt = isUser ? '>' : '$';

  return (
    <div className={`claude-message claude-message--${message.role}`}>
      <div className="claude-message__gutter">
        <span className="claude-message__prompt">{prompt}</span>
        {message.timestamp && (
          <span className="claude-message__time">{formatTime(message.timestamp)}</span>
        )}
      </div>
      <div className="claude-message__body">
        {isUser ? (
          <ClaudeUserContent message={message} />
        ) : (
          message.blocks?.map((block, i) => (
            <AssistantBlock key={i} block={block} />
          ))
        )}
      </div>
    </div>
  );
}

function ClaudeUserContent({ message }: { message: Message }) {
  if (message.textContent) {
    return <MarkdownContent content={message.textContent} />;
  }

  if (message.toolResults && message.toolResults.length > 0) {
    return (
      <div className="claude-tool-results">
        {message.toolResults.map((tr, i) => (
          <ClaudeToolResultDisplay key={i} result={tr} />
        ))}
      </div>
    );
  }

  return <span className="claude-message__empty">(empty)</span>;
}
