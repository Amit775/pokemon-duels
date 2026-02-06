/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  publicDir: resolve(__dirname, 'public'),
  build: {
    target: ['es2020'],
    outDir: resolve(__dirname, '../../dist/apps/docs/client'),
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      vite: {
        tsconfig: resolve(__dirname, 'tsconfig.app.json'),
      },
      content: {
        highlighter: 'prismjs',
        prismOptions: {
          additionalLangs: ['csharp', 'json', 'bash', 'xml'],
        },
      },
      prerender: {
        routes: [
          '/',
          '/guides/developers',
          '/guides/developers/index',
          '/guides/users',
          '/guides/users/index',
          '/guides/agents',
          '/guides/agents/index',
          '/guides/agents/001-architecture-overview',
          '/guides/agents/002-realtime-multiplayer',
          '/guides/agents/003-database-strategy',
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
