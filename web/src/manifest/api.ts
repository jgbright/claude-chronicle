import type { EditManifest, Edit, ManifestMetadata } from './types';

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

export async function updateMetadata(sessionId: string, metadata: ManifestMetadata): Promise<EditManifest> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/manifest/metadata`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error(`Failed to update metadata: ${res.statusText}`);
  return res.json();
}

export async function revealSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/reveal`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to reveal session: ${res.statusText}`);
}

export async function deleteSession(sessionId: string): Promise<EditManifest> {
  return updateMetadata(sessionId, { deleted: true });
}

export async function restoreSession(sessionId: string): Promise<EditManifest> {
  return updateMetadata(sessionId, { deleted: false });
}
