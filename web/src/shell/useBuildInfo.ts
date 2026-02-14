import { useState, useEffect } from 'react';
import type { BuildInfo } from './api';
import { fetchBuildInfo } from './api';

export function useBuildInfo(): BuildInfo | null {
  const [info, setInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    fetchBuildInfo().then(setInfo).catch(() => {});
  }, []);

  return info;
}
