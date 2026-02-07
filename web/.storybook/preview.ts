import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.parameters.theme || 'claude';
      document.documentElement.setAttribute('data-theme', theme);
      return Story();
    },
  ],
};

export default preview;
