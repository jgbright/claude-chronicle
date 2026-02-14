import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface Props {
  content: string;
}

export function MarkdownContent({ content }: Props) {
  if (!content) return null;

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            const isInline = !match && !className && !codeText.includes('\n');

            if (isInline) {
              return <code className="inline-code" {...props}>{children}</code>;
            }

            return <CodeBlock code={codeText} language={match?.[1] || 'text'} />;
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
