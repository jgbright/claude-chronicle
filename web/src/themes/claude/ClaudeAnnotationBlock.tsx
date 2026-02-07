import { MarkdownContent } from '../../shared/MarkdownContent';

interface Props {
  content: string;
  onDelete?: () => void;
  editMode?: boolean;
}

export function ClaudeAnnotationBlock({ content, onDelete, editMode }: Props) {
  return (
    <div className="claude-annotation">
      <div className="claude-annotation__header">
        <span className="claude-annotation__badge"># commentary</span>
        {editMode && onDelete && (
          <button className="claude-annotation__delete" onClick={onDelete}>
            [x] remove
          </button>
        )}
      </div>
      <div className="claude-annotation__body">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}
