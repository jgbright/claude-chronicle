import { MarkdownContent } from '../../shared/MarkdownContent';

interface Props {
  content: string;
  onDelete?: () => void;
  editMode?: boolean;
}

export function CopilotAnnotationBlock({ content, onDelete, editMode }: Props) {
  return (
    <div className="copilot-annotation">
      <div className="copilot-annotation__header">
        <span className="copilot-annotation__badge">Commentary</span>
        {editMode && onDelete && (
          <button className="copilot-annotation__delete" onClick={onDelete}>
            Remove
          </button>
        )}
      </div>
      <div className="copilot-annotation__body">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}
