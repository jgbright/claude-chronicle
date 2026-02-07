import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

describe('CodeBlock', () => {
  it('renders code content in a code element', () => {
    const { container } = render(<CodeBlock code="const x = 1;" language="typescript" />);
    const codeEl = container.querySelector('code');
    expect(codeEl).not.toBeNull();
    expect(codeEl!.textContent).toBe('const x = 1;');
  });

  it('renders with code-block class', () => {
    const { container } = render(<CodeBlock code="hello" />);
    expect(container.querySelector('.code-block')).not.toBeNull();
  });

  it('renders pre element with code-block__pre class', () => {
    const { container } = render(<CodeBlock code="hello" />);
    expect(container.querySelector('.code-block__pre')).not.toBeNull();
  });

  it('shows language label for non-text languages', () => {
    const { container } = render(<CodeBlock code="package main" language="go" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel).not.toBeNull();
    expect(langLabel!.textContent).toBe('go');
  });

  it('does not show language label for text', () => {
    const { container } = render(<CodeBlock code="plain" language="text" />);
    expect(container.querySelector('.code-block__lang')).toBeNull();
  });

  it('does not show language label when language defaults to text', () => {
    const { container } = render(<CodeBlock code="plain" />);
    expect(container.querySelector('.code-block__lang')).toBeNull();
  });

  it('adds error class when isError is true', () => {
    const { container } = render(<CodeBlock code="err" isError />);
    expect(container.querySelector('.code-block--error')).not.toBeNull();
  });

  it('does not add error class when isError is false', () => {
    const { container } = render(<CodeBlock code="ok" />);
    expect(container.querySelector('.code-block--error')).toBeNull();
  });

  it('resolves ts to typescript via langMap', () => {
    const { container } = render(<CodeBlock code="let x = 1;" language="ts" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel!.textContent).toBe('typescript');
  });

  it('resolves tsx to tsx via langMap', () => {
    const { container } = render(<CodeBlock code="<div />" language="tsx" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel!.textContent).toBe('tsx');
  });

  it('resolves sh to bash via langMap', () => {
    const { container } = render(<CodeBlock code="ls" language="sh" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel!.textContent).toBe('bash');
  });

  it('resolves shell to bash via langMap', () => {
    const { container } = render(<CodeBlock code="echo hi" language="shell" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel!.textContent).toBe('bash');
  });

  it('resolves plaintext to text (no language label)', () => {
    const { container } = render(<CodeBlock code="data" language="plaintext" />);
    expect(container.querySelector('.code-block__lang')).toBeNull();
  });

  it('resolves empty string to text', () => {
    const { container } = render(<CodeBlock code="data" language="" />);
    expect(container.querySelector('.code-block__lang')).toBeNull();
  });

  it('passes through unknown languages as-is', () => {
    const { container } = render(<CodeBlock code="x" language="rust" />);
    const langLabel = container.querySelector('.code-block__lang');
    expect(langLabel!.textContent).toBe('rust');
  });
});
