const API_BASE = '/api';

export async function exportSession(sessionId: string, theme: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme }),
  });
  if (!res.ok) throw new Error(`Failed to export: ${res.statusText}`);
  return res.blob();
}
