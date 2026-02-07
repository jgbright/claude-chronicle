import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ExportViewer } from './export/ExportViewer';

// In export mode, data is injected into the page by the Go export engine
declare global {
  interface Window {
    __CHRONICLE_DATA__: unknown;
  }
}

const data = window.__CHRONICLE_DATA__;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExportViewer data={data} />
  </StrictMode>,
);
