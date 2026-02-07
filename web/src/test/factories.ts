import type { Message, ContentBlock, SessionInfo, ParsedSession, ToolResult, ToolUseResultData } from '../session/types';
import type { EditManifest, Edit } from '../manifest/types';

let counter = 0;

function nextId(): string {
  return `test-id-${++counter}`;
}

export function resetIdCounter(): void {
  counter = 0;
}

export function createContentBlock(overrides: Partial<ContentBlock> = {}): ContentBlock {
  return {
    type: 'text',
    text: 'Hello from assistant',
    ...overrides,
  };
}

export function createToolResult(overrides: Partial<ToolResult> = {}): ToolResult {
  return {
    toolUseId: nextId(),
    content: 'tool output',
    ...overrides,
  };
}

export function createToolUseResultData(overrides: Partial<ToolUseResultData> = {}): ToolUseResultData {
  return {
    ...overrides,
  };
}

export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: nextId(),
    role: 'assistant',
    timestamp: '2025-01-15T10:30:00Z',
    blocks: [createContentBlock()],
    ...overrides,
  };
}

export function createUserMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: nextId(),
    role: 'user',
    timestamp: '2025-01-15T10:29:00Z',
    textContent: 'Hello from user',
    ...overrides,
  };
}

export function createSessionInfo(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    id: nextId(),
    projectDir: '/home/user/project',
    projectName: 'my-project',
    filePath: '/home/user/.claude/projects/my-project/session.jsonl',
    modTime: '2025-01-15T10:30:00Z',
    sizeBytes: 1024,
    ...overrides,
  };
}

export function createParsedSession(overrides: Partial<ParsedSession> = {}): ParsedSession {
  return {
    info: createSessionInfo(),
    messages: [
      createUserMessage(),
      createMessage(),
    ],
    ...overrides,
  };
}

export function createManifest(overrides: Partial<EditManifest> = {}): EditManifest {
  return {
    version: 1,
    sessionId: 'test-session',
    edits: [],
    ...overrides,
  };
}

export function createDeleteEdit(blockId: string): Edit {
  return { type: 'delete', blockId };
}

export function createCollapseEdit(blockIds: string[], summary: string): Edit {
  return { type: 'collapse', blockIds, summary };
}

export function createAnnotateEdit(afterBlockId: string, content: string, id?: string): Edit {
  return { type: 'annotate', afterBlockId, content, id: id || nextId() };
}

export function createEditTextEdit(blockId: string, newContent: string): Edit {
  return { type: 'editText', blockId, newContent };
}
