import { useState, useRef, useEffect } from 'react';

interface Props {
  messageId: string;
  onHide: (id: string) => void;
  onAnnotate: (afterId: string, content: string) => void;
}

export function MessageActions({ messageId, onHide, onAnnotate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAnnotate, setShowAnnotate] = useState(false);
  const [annotateText, setAnnotateText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleAnnotateSubmit = () => {
    if (annotateText.trim()) {
      onAnnotate(messageId, annotateText.trim());
      setAnnotateText('');
      setShowAnnotate(false);
    }
  };

  return (
    <>
      <div className="message-actions">
        <button
          className="message-actions__btn message-actions__btn--annotate"
          onClick={() => {
            setShowAnnotate(!showAnnotate);
            setMenuOpen(false);
          }}
          title="Add annotation"
          aria-label="Add annotation"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 8.5v5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h5" />
            <path d="M11.5 1.5l3 3-7 7H4.5v-3l7-7z" />
          </svg>
        </button>
        <div className="message-actions__menu-anchor" ref={menuRef}>
          <button
            className="message-actions__btn"
            onClick={() => setMenuOpen(!menuOpen)}
            title="More actions"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="message-actions__menu" role="menu">
              <button
                className="message-actions__menu-item"
                role="menuitem"
                onClick={() => {
                  onHide(messageId);
                  setMenuOpen(false);
                }}
              >
                Hide
              </button>
              <button
                className="message-actions__menu-item"
                role="menuitem"
                onClick={() => {
                  setShowAnnotate(true);
                  setMenuOpen(false);
                }}
              >
                Annotate
              </button>
            </div>
          )}
        </div>
      </div>
      {showAnnotate && (
        <div className="message-actions__annotate-form">
          <textarea
            className="message-actions__textarea"
            value={annotateText}
            onChange={(e) => setAnnotateText(e.target.value)}
            placeholder="Add commentary (Markdown supported)..."
            rows={3}
            autoFocus
          />
          <div className="message-actions__annotate-buttons">
            <button className="message-actions__form-btn" onClick={() => setShowAnnotate(false)}>
              Cancel
            </button>
            <button className="message-actions__form-btn message-actions__form-btn--primary" onClick={handleAnnotateSubmit}>
              Add
            </button>
          </div>
        </div>
      )}
    </>
  );
}
