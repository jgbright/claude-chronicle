import type { EditManifest, Edit } from './types';

const API_BASE = '/api';

export async function fetchManifest(sessionId: string): Promise<EditManifest> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/manifest`);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.statusText}`);
  return res.json();
}

export async function saveManifest(sessionId: string, manifest: EditManifest): Promise<EditManifest> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/manifest`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest),
  });
  if (!res.ok) throw new Error(`Failed to save manifest: ${res.statusText}`);
  return res.json();
}

export async function addEdit(sessionId: string, edit: Edit): Promise<EditManifest> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/manifest/edits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(edit),
  });
  if (!res.ok) throw new Error(`Failed to add edit: ${res.statusText}`);
  return res.json();
}

export async function removeEdit(sessionId: string, index: number): Promise<EditManifest> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/manifest/edits/${index}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove edit: ${res.statusText}`);
  return res.json();
}
