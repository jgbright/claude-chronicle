import { useState, useEffect } from 'react';
import type { ParsedSession } from '../session/types';
import type { EditManifest } from '../manifest/types';
import type { Theme } from '../themes/useTheme';
import { SessionViewer } from '../session/SessionViewer';
import { Toolbar } from '../shell/Toolbar';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { getThemeComponents } from '../themes/registry';

interface ExportData {
  session: ParsedSession;
  manifest: EditManifest | null;
  theme: string;
}

interface Props {
  data: unknown;
}

export function ExportViewer({ data }: Props) {
  if (!data) {
    return <div className="app__error">No session data found</div>;
  }

  return <ExportViewerInner data={data as ExportData} />;
}

function ExportViewerInner({ data }: { data: ExportData }) {
  const [theme, setTheme] = useState<Theme>(
    data.theme === 'copilot' ? 'copilot' : 'claude',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themeComponents = getThemeComponents(theme);
  const { Wrapper: ThemeWrapper } = themeComponents;
  const manifest = data.manifest;

  return (
    <ThemeComponentProvider value={themeComponents}>
      <ThemeWrapper>
        <div className="app">
          <Toolbar
            theme={theme}
            onThemeChange={setTheme}
            sessionTitle={data.session.info.projectName}
            hasSession={true}
          />
          <div className="app__main">
            <div className="app__content">
              <SessionViewer
                session={data.session}
                manifest={manifest}
              />
            </div>
          </div>
        </div>
      </ThemeWrapper>
    </ThemeComponentProvider>
  );
}
