import type { Message } from '../session/types';
import type { EditManifest } from './types';

export interface TransformedMessage extends Message {
  isCollapsed?: boolean;
  collapseSummary?: string;
  collapsedCount?: number;
  isAnnotation?: boolean;
  isDeleted?: boolean;
}

export function applyManifest(
  messages: Message[],
  manifest: EditManifest | null,
  options?: { showDeleted?: boolean }
): TransformedMessage[] {
  if (!messages) {
    return [];
  }

  if (!manifest || !manifest.edits || manifest.edits.length === 0) {
    return messages;
  }

  const deleted = new Set<string>();
  const collapsed = new Map<string, string>(); // blockId -> summary
  const collapseFirstIds = new Set<string>();
  const collapseGroupSizes = new Map<string, number>(); // firstId -> count
  const annotations = new Map<string, Array<{ id: string; content: string }>>();
  const textEdits = new Map<string, string>(); // blockId -> newContent

  for (const edit of manifest.edits) {
    switch (edit.type) {
      case 'delete':
        deleted.add(edit.blockId);
        break;
      case 'collapse':
        if (edit.blockIds.length > 0) {
          const first = edit.blockIds[0];
          collapseFirstIds.add(first);
          collapseGroupSizes.set(first, edit.blockIds.length);
          for (const id of edit.blockIds) {
            collapsed.set(id, edit.summary);
          }
        }
        break;
      case 'annotate':
        if (!annotations.has(edit.afterBlockId)) {
          annotations.set(edit.afterBlockId, []);
        }
        annotations.get(edit.afterBlockId)!.push({
          id: edit.id,
          content: edit.content,
        });
        break;
      case 'editText':
        textEdits.set(edit.blockId, edit.newContent);
        break;
    }
  }

  const result: TransformedMessage[] = [];

  for (const msg of messages) {
    if (deleted.has(msg.id)) {
      if (options?.showDeleted) {
        result.push({ ...msg, isDeleted: true });
      }
      continue;
    }

    if (collapsed.has(msg.id)) {
      if (collapseFirstIds.has(msg.id)) {
        result.push({
          ...msg,
          isCollapsed: true,
          collapseSummary: collapsed.get(msg.id),
          collapsedCount: collapseGroupSizes.get(msg.id),
        });
      }
      continue;
    }

    // Apply text edits
    let transformed: TransformedMessage = { ...msg };
    if (textEdits.has(msg.id)) {
      transformed = {
        ...transformed,
        textContent: textEdits.get(msg.id),
      };
    }

    result.push(transformed);

    // Insert annotations after this message
    const annots = annotations.get(msg.id);
    if (annots) {
      for (const a of annots) {
        result.push({
          id: a.id,
          role: 'user',
          timestamp: msg.timestamp,
          textContent: a.content,
          isAnnotation: true,
        });
      }
    }
  }

  return result;
}
