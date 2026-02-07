import { describe, it, expect } from 'vitest';
import { applyManifest } from './sessionTransform';
import {
  createMessage,
  createUserMessage,
  createManifest,
  createDeleteEdit,
  createCollapseEdit,
  createAnnotateEdit,
  createEditTextEdit,
} from '../test/factories';

describe('applyManifest', () => {
  it('returns messages unchanged when manifest is null', () => {
    const messages = [createUserMessage({ id: 'u1' }), createMessage({ id: 'a1' })];
    const result = applyManifest(messages, null);
    expect(result).toBe(messages);
  });

  it('returns messages unchanged when manifest has empty edits', () => {
    const messages = [createUserMessage({ id: 'u1' })];
    const manifest = createManifest({ edits: [] });
    const result = applyManifest(messages, manifest);
    expect(result).toBe(messages);
  });

  it('deletes a message by id', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
    ];
    const manifest = createManifest({ edits: [createDeleteEdit('a1')] });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(['u1', 'a2']);
  });

  it('deletes multiple messages', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
    ];
    const manifest = createManifest({
      edits: [createDeleteEdit('u1'), createDeleteEdit('a2')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('collapses messages into a single group', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
      createMessage({ id: 'a3' }),
    ];
    const manifest = createManifest({
      edits: [createCollapseEdit(['a1', 'a2', 'a3'], 'Collapsed items')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('u1');
    expect(result[1].isCollapsed).toBe(true);
    expect(result[1].collapseSummary).toBe('Collapsed items');
    expect(result[1].collapsedCount).toBe(3);
  });

  it('collapse with empty blockIds produces no collapsed group', () => {
    const messages = [createMessage({ id: 'a1' })];
    const manifest = createManifest({
      edits: [createCollapseEdit([], 'Empty')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
    expect(result[0].isCollapsed).toBeUndefined();
  });

  it('inserts annotation after a message', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
    ];
    const manifest = createManifest({
      edits: [createAnnotateEdit('u1', 'My note', 'annot-1')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('u1');
    expect(result[1].isAnnotation).toBe(true);
    expect(result[1].textContent).toBe('My note');
    expect(result[1].id).toBe('annot-1');
    expect(result[1].role).toBe('user');
    expect(result[2].id).toBe('a1');
  });

  it('inserts multiple annotations after the same message', () => {
    const messages = [createMessage({ id: 'a1' })];
    const manifest = createManifest({
      edits: [
        createAnnotateEdit('a1', 'First note', 'annot-1'),
        createAnnotateEdit('a1', 'Second note', 'annot-2'),
      ],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('a1');
    expect(result[1].textContent).toBe('First note');
    expect(result[2].textContent).toBe('Second note');
  });

  it('applies editText to a message', () => {
    const messages = [
      createUserMessage({ id: 'u1', textContent: 'Original' }),
    ];
    const manifest = createManifest({
      edits: [createEditTextEdit('u1', 'Edited text')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
    expect(result[0].textContent).toBe('Edited text');
  });

  it('editText overrides previous editText for the same block', () => {
    const messages = [createUserMessage({ id: 'u1', textContent: 'Original' })];
    const manifest = createManifest({
      edits: [
        createEditTextEdit('u1', 'First edit'),
        createEditTextEdit('u1', 'Second edit'),
      ],
    });
    const result = applyManifest(messages, manifest);
    expect(result[0].textContent).toBe('Second edit');
  });

  it('combines delete and annotate edits', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
    ];
    const manifest = createManifest({
      edits: [
        createDeleteEdit('a1'),
        createAnnotateEdit('u1', 'Note after delete', 'annot-1'),
      ],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('u1');
    expect(result[1].isAnnotation).toBe(true);
    expect(result[2].id).toBe('a2');
  });

  it('combines delete, collapse, annotate, and editText edits', () => {
    const messages = [
      createUserMessage({ id: 'u1', textContent: 'Hello' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
      createMessage({ id: 'a3' }),
      createMessage({ id: 'a4' }),
    ];
    const manifest = createManifest({
      edits: [
        createDeleteEdit('a1'),
        createCollapseEdit(['a2', 'a3'], 'Collapsed pair'),
        createAnnotateEdit('u1', 'Annotation text', 'annot-1'),
        createEditTextEdit('u1', 'Edited hello'),
      ],
    });
    const result = applyManifest(messages, manifest);
    // u1 (edited) + annot-1 + collapsed(a2) + a4
    expect(result).toHaveLength(4);
    expect(result[0].textContent).toBe('Edited hello');
    expect(result[1].isAnnotation).toBe(true);
    expect(result[2].isCollapsed).toBe(true);
    expect(result[2].collapsedCount).toBe(2);
    expect(result[3].id).toBe('a4');
  });

  it('does not mutate original messages array', () => {
    const messages = [createUserMessage({ id: 'u1', textContent: 'Original' })];
    const manifest = createManifest({
      edits: [createEditTextEdit('u1', 'Edited')],
    });
    applyManifest(messages, manifest);
    expect(messages[0].textContent).toBe('Original');
  });

  it('does not mutate original message objects', () => {
    const original = createMessage({ id: 'a1' });
    const messages = [original];
    const manifest = createManifest({
      edits: [createAnnotateEdit('a1', 'Note', 'annot-1')],
    });
    const result = applyManifest(messages, manifest);
    expect(result[0]).not.toBe(original);
    expect(original).not.toHaveProperty('isCollapsed');
  });

  it('annotation inherits timestamp from the target message', () => {
    const messages = [createMessage({ id: 'a1', timestamp: '2025-06-01T12:00:00Z' })];
    const manifest = createManifest({
      edits: [createAnnotateEdit('a1', 'Note', 'annot-1')],
    });
    const result = applyManifest(messages, manifest);
    expect(result[1].timestamp).toBe('2025-06-01T12:00:00Z');
  });

  it('ignores delete for non-existent id', () => {
    const messages = [createMessage({ id: 'a1' })];
    const manifest = createManifest({
      edits: [createDeleteEdit('nonexistent')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('ignores annotation for non-existent afterBlockId', () => {
    const messages = [createMessage({ id: 'a1' })];
    const manifest = createManifest({
      edits: [createAnnotateEdit('nonexistent', 'Note', 'annot-1')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
  });

  it('ignores editText for non-existent blockId', () => {
    const messages = [createUserMessage({ id: 'u1', textContent: 'Original' })];
    const manifest = createManifest({
      edits: [createEditTextEdit('nonexistent', 'Changed')],
    });
    const result = applyManifest(messages, manifest);
    expect(result[0].textContent).toBe('Original');
  });

  it('showDeleted includes deleted messages with isDeleted flag', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
    ];
    const manifest = createManifest({ edits: [createDeleteEdit('a1')] });
    const result = applyManifest(messages, manifest, { showDeleted: true });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('u1');
    expect(result[1].id).toBe('a1');
    expect(result[1].isDeleted).toBe(true);
    expect(result[2].id).toBe('a2');
    expect(result[2].isDeleted).toBeUndefined();
  });

  it('showDeleted false still hides deleted messages', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
    ];
    const manifest = createManifest({ edits: [createDeleteEdit('a1')] });
    const result = applyManifest(messages, manifest, { showDeleted: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
  });

  it('showDeleted does not include annotations for deleted messages', () => {
    const messages = [
      createUserMessage({ id: 'u1' }),
      createMessage({ id: 'a1' }),
    ];
    const manifest = createManifest({
      edits: [
        createDeleteEdit('a1'),
        createAnnotateEdit('a1', 'Note on deleted', 'annot-1'),
      ],
    });
    const result = applyManifest(messages, manifest, { showDeleted: true });
    // u1, a1 (deleted ghost) — annotation is skipped because a1 is deleted
    expect(result).toHaveLength(2);
    expect(result[1].isDeleted).toBe(true);
    expect(result.find((m) => m.isAnnotation)).toBeUndefined();
  });

  it('collapsed first message gets the group metadata', () => {
    const messages = [
      createMessage({ id: 'a1' }),
      createMessage({ id: 'a2' }),
    ];
    const manifest = createManifest({
      edits: [createCollapseEdit(['a1', 'a2'], 'Group')],
    });
    const result = applyManifest(messages, manifest);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
    expect(result[0].isCollapsed).toBe(true);
    expect(result[0].collapseSummary).toBe('Group');
    expect(result[0].collapsedCount).toBe(2);
  });
});
