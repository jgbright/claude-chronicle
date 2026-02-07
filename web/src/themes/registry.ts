import type { Theme } from './useTheme';
import type { ThemeComponentSet } from './ThemeComponents';
import { claudeComponents } from './claude/components';
import { copilotComponents } from './copilot/components';

const themeRegistry: Record<Theme, ThemeComponentSet> = {
  claude: claudeComponents,
  copilot: copilotComponents,
};

export function getThemeComponents(theme: Theme): ThemeComponentSet {
  return themeRegistry[theme];
}
