import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { SessionViewer } from './SessionViewer';
import { ThemeComponentProvider } from '../themes/ThemeContext';
import { claudeComponents } from '../themes/claude/components';
import { copilotComponents } from '../themes/copilot/components';
import type { ParsedSession } from './types';
import type { ThemeComponentSet } from '../themes/ThemeComponents';

const fixturesDir = path.resolve(__dirname, '../test/fixtures/smoke');
const hasFixtures =
  fs.existsSync(fixturesDir) &&
  fs.readdirSync(fixturesDir).some((f) => f.endsWith('.json'));

const themes: [string, ThemeComponentSet][] = [
  ['claude', claudeComponents],
  ['copilot', copilotComponents],
];

function loadFixtures(): { name: string; session: ParsedSession }[] {
  if (!hasFixtures) return [];
  return fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      name: f.replace(/\.json$/, ''),
      session: JSON.parse(
        fs.readFileSync(path.join(fixturesDir, f), 'utf-8'),
      ) as ParsedSession,
    }));
}

describe.skipIf(!hasFixtures)('SessionViewer smoke tests', () => {
  const fixtures = loadFixtures();

  for (const { name, session } of fixtures) {
    for (const [themeName, components] of themes) {
      it(`renders ${name} with ${themeName} theme without crashing`, () => {
        expect(() => {
          const { unmount } = render(
            <ThemeComponentProvider value={components}>
              <SessionViewer
                session={session}
                manifest={null}
                onAddEdit={() => {}}
                onRemoveEdit={() => {}}
              />
            </ThemeComponentProvider>,
          );
          unmount();
        }).not.toThrow();
      });
    }
  }
});
