import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolUseBlock } from './ToolUseBlock';
import { toolSummary, guessLanguage } from './toolUtils';

describe('toolSummary', () => {
  it('returns command for Bash tool', () => {
    expect(toolSummary('Bash', { command: 'echo hello' })).toBe('echo hello');
  });

  it('truncates long Bash commands to 100 chars', () => {
    const longCmd = 'x'.repeat(200);
    expect(toolSummary('Bash', { command: longCmd })).toHaveLength(100);
  });

  it('returns file_path for Read tool', () => {
    expect(toolSummary('Read', { file_path: '/src/main.ts' })).toBe('/src/main.ts');
  });

  it('returns file_path for Write tool', () => {
    expect(toolSummary('Write', { file_path: '/src/app.tsx' })).toBe('/src/app.tsx');
  });

  it('returns file_path for Edit tool', () => {
    expect(toolSummary('Edit', { file_path: '/config.json' })).toBe('/config.json');
  });

  it('returns pattern for Glob tool', () => {
    expect(toolSummary('Glob', { pattern: '**/*.ts' })).toBe('**/*.ts');
  });

  it('returns formatted string for Grep tool', () => {
    expect(toolSummary('Grep', { pattern: 'TODO', path: '/src' })).toBe('/TODO/ /src');
  });

  it('returns description for Task tool', () => {
    expect(toolSummary('Task', { description: 'Find tests' })).toBe('Find tests');
  });

  it('returns url for WebFetch tool', () => {
    expect(toolSummary('WebFetch', { url: 'https://example.com' })).toBe('https://example.com');
  });

  it('returns query for WebSearch tool', () => {
    expect(toolSummary('WebSearch', { query: 'vitest docs' })).toBe('vitest docs');
  });

  it('returns empty string for unknown tool', () => {
    expect(toolSummary('UnknownTool', { foo: 'bar' })).toBe('');
  });

  it('handles missing input fields gracefully', () => {
    expect(toolSummary('Bash', {})).toBe('');
    expect(toolSummary('Read', {})).toBe('');
    expect(toolSummary('Glob', {})).toBe('');
  });

  it('handles Grep with no path', () => {
    expect(toolSummary('Grep', { pattern: 'test' })).toBe('/test/ ');
  });
});

describe('guessLanguage', () => {
  it('returns typescript for .ts files', () => {
    expect(guessLanguage('main.ts')).toBe('typescript');
  });

  it('returns typescript for .tsx files', () => {
    expect(guessLanguage('App.tsx')).toBe('typescript');
  });

  it('returns javascript for .js files', () => {
    expect(guessLanguage('index.js')).toBe('javascript');
  });

  it('returns javascript for .jsx files', () => {
    expect(guessLanguage('App.jsx')).toBe('javascript');
  });

  it('returns go for .go files', () => {
    expect(guessLanguage('main.go')).toBe('go');
  });

  it('returns python for .py files', () => {
    expect(guessLanguage('script.py')).toBe('python');
  });

  it('returns rust for .rs files', () => {
    expect(guessLanguage('lib.rs')).toBe('rust');
  });

  it('returns json for .json files', () => {
    expect(guessLanguage('package.json')).toBe('json');
  });

  it('returns yaml for .yaml and .yml files', () => {
    expect(guessLanguage('config.yaml')).toBe('yaml');
    expect(guessLanguage('config.yml')).toBe('yaml');
  });

  it('returns bash for .sh files', () => {
    expect(guessLanguage('run.sh')).toBe('bash');
  });

  it('returns text for unknown extensions', () => {
    expect(guessLanguage('file.xyz')).toBe('text');
  });

  it('returns text for files without extension', () => {
    expect(guessLanguage('Makefile')).toBe('text');
  });

  it('handles paths with directories', () => {
    expect(guessLanguage('/home/user/project/src/main.ts')).toBe('typescript');
  });
});

describe('ToolUseBlock component', () => {
  it('renders the tool name', () => {
    const { container } = render(<ToolUseBlock toolName="Bash" toolId="t1" input={{ command: 'ls' }} />);
    const nameEl = container.querySelector('.tool-use__name');
    expect(nameEl!.textContent).toBe('Bash');
  });

  it('renders the summary text', () => {
    const { container } = render(<ToolUseBlock toolName="Read" toolId="t1" input={{ file_path: '/src/app.ts' }} />);
    const summaryEl = container.querySelector('.tool-use__summary');
    expect(summaryEl!.textContent).toBe('/src/app.ts');
  });

  it('is collapsed by default', () => {
    const { container } = render(<ToolUseBlock toolName="Bash" toolId="t1" input={{ command: 'echo hi' }} />);
    expect(container.querySelector('.tool-use__body')).toBeNull();
  });

  it('expands on click to show body', async () => {
    const user = userEvent.setup();
    const { container } = render(<ToolUseBlock toolName="Bash" toolId="t1" input={{ command: 'echo hi' }} />);
    await user.click(container.querySelector('.tool-use__header')!);
    expect(container.querySelector('.tool-use__body')).not.toBeNull();
  });

  it('collapses again on second click', async () => {
    const user = userEvent.setup();
    const { container } = render(<ToolUseBlock toolName="Bash" toolId="t1" input={{ command: 'echo hi' }} />);
    const header = container.querySelector('.tool-use__header')!;
    await user.click(header);
    expect(container.querySelector('.tool-use__body')).not.toBeNull();
    await user.click(header);
    expect(container.querySelector('.tool-use__body')).toBeNull();
  });

  it('does not render summary for unknown tool', () => {
    const { container } = render(
      <ToolUseBlock toolName="Mystery" toolId="t1" input={{ data: 'x' }} />
    );
    expect(container.querySelector('.tool-use__summary')).toBeNull();
  });

  it('shows Glob detail when expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(<ToolUseBlock toolName="Glob" toolId="t1" input={{ pattern: '*.ts', path: '/src' }} />);
    await user.click(container.querySelector('.tool-use__header')!);
    const detail = container.querySelector('.tool-use__detail');
    expect(detail).not.toBeNull();
    expect(detail!.textContent).toContain('*.ts');
    expect(detail!.textContent).toContain('/src');
  });

  it('shows JSON for unsupported tool when expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(<ToolUseBlock toolName="CustomTool" toolId="t1" input={{ key: 'value' }} />);
    await user.click(container.querySelector('.tool-use__header')!);
    const body = container.querySelector('.tool-use__body');
    expect(body).not.toBeNull();
    expect(body!.textContent).toContain('"key"');
    expect(body!.textContent).toContain('"value"');
  });
});
