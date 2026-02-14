import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-toml';

interface Props {
  code: string;
  language?: string;
  isError?: boolean;
}

const langMap: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  powershell: 'bash',
  text: 'text',
  plaintext: 'text',
  '': 'text',
};

export function CodeBlock({ code, language = 'text', isError }: Props) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const resolvedLang = langMap[language] || language;
  const hasHighlighting = resolvedLang !== 'text' && Prism.languages[resolvedLang];

  useEffect(() => {
    if (codeRef.current && hasHighlighting) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, hasHighlighting]);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`code-block ${isError ? 'code-block--error' : ''}`}>
      <div className="code-block__toolbar">
        {resolvedLang !== 'text' && (
          <span className="code-block__lang">{resolvedLang}</span>
        )}
        <button
          className="code-block__copy"
          onClick={handleCopy}
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
            </svg>
          )}
        </button>
      </div>
      <pre className="code-block__pre">
        <code
          ref={codeRef}
          className={hasHighlighting ? `language-${resolvedLang}` : ''}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
