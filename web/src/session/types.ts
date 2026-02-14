export interface SessionInfo {
  id: string;
  projectDir: string;
  projectName: string;
  filePath: string;
  modTime: string;
  sizeBytes: number;
  title?: string;
  deleted?: boolean;
}

export interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
  // text
  text?: string;
  // thinking
  thinking?: string;
  // tool_use
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  // tool_result
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
}

export interface ToolUseResultData {
  type?: string;
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;
  isImage?: boolean;
  filePath?: string;
  content?: string;
  originalFile?: string;
  structuredPatch?: PatchFile[];
  filenames?: string[];
  numFiles?: number;
  truncated?: boolean;
  status?: string;
  prompt?: string;
  agentId?: string;
  questions?: unknown;
  answers?: unknown;
  file?: string;
}

export interface PatchFile {
  oldFileName: string;
  newFileName: string;
  hunks: PatchHunk[];
}

export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines?: string[];
  changes?: HunkChange[];
}

export interface HunkChange {
  type: string;
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface ToolResult {
  toolUseId: string;
  content: string;
  isError?: boolean;
  result?: ToolUseResultData;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  blocks?: ContentBlock[];
  textContent?: string;
  toolResults?: ToolResult[];
}

export interface ParsedSession {
  info: SessionInfo;
  messages: Message[];
}
