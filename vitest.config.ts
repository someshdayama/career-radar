import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Ensure .jsx/.tsx files are processed by @vitejs/plugin-react (Babel/esbuild)
      include: /\.(jsx|tsx)$/,
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{jsx,ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/app/api/**',
        'src/lib/scrapers/**',
        'src/data/**',
        'src/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Ensure extensionless imports resolve .jsx before .js
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
});
