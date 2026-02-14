import type { PatchFile } from '../session/types';

/** Count additions and deletions from structured patch */
export function countDiffStats(patches: PatchFile[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const file of patches) {
    if (!Array.isArray(file.hunks)) continue;
    for (const hunk of file.hunks) {
      if (hunk.changes) {
        for (const change of hunk.changes) {
          if (change.type === 'add') added++;
          else if (change.type === 'del' || change.type === 'remove') removed++;
        }
      } else if (hunk.lines) {
        for (const line of hunk.lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) added++;
          else if (line.startsWith('-') && !line.startsWith('---')) removed++;
        }
      }
    }
  }
  return { added, removed };
}
