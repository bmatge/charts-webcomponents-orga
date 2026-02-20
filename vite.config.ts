import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/gouv-orgchart.ts'),
      name: 'GouvOrgchart',
      fileName: 'gouv-orgchart',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
    },
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
