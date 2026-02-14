import { MarkdownContent } from '../../shared/MarkdownContent';

interface Props {
  content: string;
  onDelete?: () => void;
}

export function CopilotAnnotationBlock({ content, onDelete }: Props) {
  return (
    <div className="copilot-annotation">
      <div className="copilot-annotation__header">
        <span className="copilot-annotation__badge">Commentary</span>
        {onDelete && (
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
