import { createElement, Fragment } from 'react';
import type { ReactNode } from 'react';
import type { ThemeComponentSet } from '../ThemeComponents';
import { ClaudeMessageBlock } from './ClaudeMessageBlock';
import { ClaudeAnnotationBlock } from './ClaudeAnnotationBlock';
import { ClaudeCollapsedGroup } from './ClaudeCollapsedGroup';

function ClaudeWrapper({ children }: { children: ReactNode }) {
  return createElement(Fragment, null, children);
}

export const claudeComponents: ThemeComponentSet = {
  Wrapper: ClaudeWrapper,
  MessageBlock: ClaudeMessageBlock,
  AnnotationBlock: ClaudeAnnotationBlock,
  CollapsedGroup: ClaudeCollapsedGroup,
};
