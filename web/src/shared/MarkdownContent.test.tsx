import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent', () => {
  it('renders plain text content', () => {
    render(<MarkdownContent content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders markdown bold text', () => {
    render(<MarkdownContent content="This is **bold** text" />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders nothing when content is empty', () => {
    const { container } = render(<MarkdownContent content="" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders inline code', () => {
    render(<MarkdownContent content="Use `console.log` to debug" />);
    expect(screen.getByText('console.log')).toBeInTheDocument();
  });

  it('renders markdown lists', () => {
    render(<MarkdownContent content={'- Item one\n- Item two'} />);
    expect(screen.getByText('Item one')).toBeInTheDocument();
    expect(screen.getByText('Item two')).toBeInTheDocument();
  });

  it('renders fenced code blocks without language as code blocks, not inline code', () => {
    const tree = '```\nproject/\n├── src/\n│   └── main.ts\n└── README.md\n```';
    const { container } = render(<MarkdownContent content={tree} />);
    // Should render as a CodeBlock (div.code-block > pre.code-block__pre), not inline code
    expect(container.querySelector('.code-block')).not.toBeNull();
    expect(container.querySelector('.code-block__pre')).not.toBeNull();
    expect(container.querySelector('.inline-code')).toBeNull();
  });
});
