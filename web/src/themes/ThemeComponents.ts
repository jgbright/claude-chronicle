import type { ComponentType, ReactNode } from 'react';
import type { Message } from '../session/types';
import type { TransformedMessage } from '../manifest/sessionTransform';

export interface ThemeComponentSet {
  /** Wrapper for theme-level providers (e.g. PrimerThemeProvider for copilot) */
  Wrapper: ComponentType<{ children: ReactNode }>;
  /** Renders a single message (user or assistant) */
  MessageBlock: ComponentType<{ message: Message | TransformedMessage }>;
  /** Renders an annotation/commentary block */
  AnnotationBlock: ComponentType<{ content: string; onDelete?: () => void }>;
  /** Renders a collapsed group of messages */
  CollapsedGroup: ComponentType<{ summary: string; count: number; children?: ReactNode }>;
}
