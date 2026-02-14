import { useState, useEffect, useCallback } from 'react';
import type { ProjectSummary } from './api';
import { fetchProjects } from './api';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchProjects()
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error, refresh };
}
