import { useState } from 'react';

interface Props {
  messageId: string;
  onDelete: (id: string) => void;
  onAnnotate: (afterId: string, content: string) => void;
}

export function EditControls({ messageId, onDelete, onAnnotate }: Props) {
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [annotateText, setAnnotateText] = useState('');

  const handleAnnotate = () => {
    if (annotateText.trim()) {
      onAnnotate(messageId, annotateText.trim());
      setAnnotateText('');
      setShowAnnotate(false);
    }
  };

  return (
    <div className="edit-controls">
      <div className="edit-controls__buttons">
        <button
          className="edit-controls__btn edit-controls__btn--delete"
          onClick={() => onDelete(messageId)}
          title="Delete this message"
        >
          Delete
        </button>
        <button
          className="edit-controls__btn edit-controls__btn--annotate"
          onClick={() => setShowAnnotate(!showAnnotate)}
          title="Add annotation after this message"
        >
          Annotate
        </button>
      </div>
      {showAnnotate && (
        <div className="edit-controls__annotate">
          <textarea
            className="edit-controls__textarea"
            value={annotateText}
            onChange={(e) => setAnnotateText(e.target.value)}
            placeholder="Add commentary (Markdown supported)..."
            rows={3}
          />
          <div className="edit-controls__annotate-actions">
            <button className="edit-controls__btn" onClick={() => setShowAnnotate(false)}>
              Cancel
            </button>
            <button className="edit-controls__btn edit-controls__btn--save" onClick={handleAnnotate}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
