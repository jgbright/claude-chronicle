import type { SessionInfo, ParsedSession } from './types';
import type { EditManifest } from '../manifest/types';

const API_BASE = '/api';

/** Combined response from GET /api/sessions/{id}. */
export interface SessionDetailResponse extends ParsedSession {
  manifest: EditManifest;
}

export interface ProjectSummary {
  name: string;
  dir: string;
  sessionCount: number;
  lastActivity: string;
}

export async function fetchSessions(params?: URLSearchParams): Promise<SessionInfo[]> {
  const url = params?.toString()
    ? `${API_BASE}/sessions?${params}`
    : `${API_BASE}/sessions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
  return res.json();
}

export async function fetchSession(id: string): Promise<SessionDetailResponse> {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.statusText}`);
  return res.json();
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
  return res.json();
}
