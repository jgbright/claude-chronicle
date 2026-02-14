import { createContext, useContext } from 'react';

export interface BulkCollapseState {
  hideThinking: boolean;
}

const BulkCollapseContext = createContext<BulkCollapseState>({ hideThinking: false });

export const BulkCollapseProvider = BulkCollapseContext.Provider;

export function useBulkCollapse(): BulkCollapseState {
  return useContext(BulkCollapseContext);
}
