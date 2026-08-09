import type { Config } from 'tailwindcss';
import sharedConfig from '@mahatest/tailwind-config';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [sharedConfig],
};

export default config;
