import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['src/**/*.spec.ts'],
    globals: true,
    testTimeout: 30000,
  },
});
