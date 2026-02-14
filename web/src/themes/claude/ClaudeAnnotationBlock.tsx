import { MarkdownContent } from '../../shared/MarkdownContent';

interface Props {
  content: string;
  onDelete?: () => void;
}

export function ClaudeAnnotationBlock({ content, onDelete }: Props) {
  return (
    <div className="claude-annotation">
      <div className="claude-annotation__header">
        <span className="claude-annotation__badge"># commentary</span>
        {onDelete && (
          <button className="claude-annotation__delete" onClick={onDelete}>
            Remove
          </button>
        )}
      </div>
      <div className="claude-annotation__body">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}
