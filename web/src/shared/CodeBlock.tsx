import { useEffect, useRef } from 'react';
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
  const resolvedLang = langMap[language] || language;
  const hasHighlighting = resolvedLang !== 'text' && Prism.languages[resolvedLang];

  useEffect(() => {
    if (codeRef.current && hasHighlighting) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, hasHighlighting]);

  return (
    <div className={`code-block ${isError ? 'code-block--error' : ''}`}>
      {resolvedLang !== 'text' && (
        <div className="code-block__lang">{resolvedLang}</div>
      )}
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
