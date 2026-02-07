import { createElement, Fragment } from 'react';
import type { ReactNode } from 'react';
import type { ThemeComponentSet } from '../ThemeComponents';
import { CopilotMessageBlock } from './CopilotMessageBlock';
import { CopilotAnnotationBlock } from './CopilotAnnotationBlock';
import { CopilotCollapsedGroup } from './CopilotCollapsedGroup';

function CopilotWrapper({ children }: { children: ReactNode }) {
  return createElement(Fragment, null, children);
}

export const copilotComponents: ThemeComponentSet = {
  Wrapper: CopilotWrapper,
  MessageBlock: CopilotMessageBlock,
  AnnotationBlock: CopilotAnnotationBlock,
  CollapsedGroup: CopilotCollapsedGroup,
};
