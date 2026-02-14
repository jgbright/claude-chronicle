export interface ManifestMetadata {
  title?: string;
  deleted?: boolean;
}

export interface EditManifest {
  version: number;
  sessionId: string;
  metadata?: ManifestMetadata;
  edits: Edit[];
}

export type Edit =
  | DeleteEdit
  | CollapseEdit
  | AnnotateEdit
  | EditTextEdit
  | ReorderEdit;

export interface DeleteEdit {
  type: 'delete';
  blockId: string;
}

export interface CollapseEdit {
  type: 'collapse';
  blockIds: string[];
  summary: string;
}

export interface AnnotateEdit {
  type: 'annotate';
  afterBlockId: string;
  content: string;
  id: string;
}

export interface EditTextEdit {
  type: 'editText';
  blockId: string;
  newContent: string;
}

export interface ReorderEdit {
  type: 'reorder';
  blockId: string;
  afterBlockId: string;
}
