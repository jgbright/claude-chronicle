export function toolSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'Bash':
      return String(input.command || '').slice(0, 100);
    case 'Read':
      return String(input.file_path || '');
    case 'Write':
      return String(input.file_path || '');
    case 'Edit':
      return String(input.file_path || '');
    case 'Glob':
      return String(input.pattern || '');
    case 'Grep':
      return `/${input.pattern || ''}/ ${input.path || ''}`;
    case 'Task':
      return String(input.description || '');
    case 'WebFetch':
      return String(input.url || '');
    case 'WebSearch':
      return String(input.query || '');
    default:
      return '';
  }
}

export function guessLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    go: 'go',
    py: 'python',
    rs: 'rust',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    css: 'css',
    html: 'html',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
  };
  return map[ext] || 'text';
}
