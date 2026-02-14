export interface BuildInfo {
  version: string;
  commit: string;
  date: string;
  branch?: string;
}

export async function fetchBuildInfo(): Promise<BuildInfo> {
  const resp = await fetch('/api/info');
  if (!resp.ok) throw new Error(`GET /api/info failed: ${resp.status}`);
  return resp.json();
}
