import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  PersonIcon,
  CopilotIcon,
} from '@primer/octicons-react';
import type { Message, ContentBlock as ContentBlockType, ToolResult } from '../../session/types';
import { ToolUseBlock } from '../../shared/ToolUseBlock';
import { CodeBlock } from '../../shared/CodeBlock';
import { MarkdownContent } from '../../shared/MarkdownContent';
import { formatTime } from '../../shared/formatUtils';

interface Props {
  message: Message;
}

function CopilotThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 150).replace(/\n/g, ' ');

  return (
    <div className="copilot-thinking">
      <button className="copilot-thinking__header" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        <span className="copilot-thinking__label">Thinking</span>
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
  return (
    <ToolUseBlock
      toolName={block.name || 'unknown'}
      toolId={block.id || ''}
      input={block.input || {}}
    />
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

function CopilotFileChange({ result }: { result: NonNullable<ToolResult['result']> }) {
  const filePath = result.filePath || '';
  const shortPath = filePath.split(/[/\\]/).slice(-3).join('/');

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
          {isUser ? <PersonIcon size={14} /> : <CopilotIcon size={14} />}
        </div>
      </div>
      <div className="copilot-message__content">
        <div className="copilot-message__header">
          <span className={`copilot-message__badge copilot-message__badge--${message.role}`}>
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
