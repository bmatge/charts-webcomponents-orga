import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync, mkdirSync } from 'fs';

/**
 * Plugin Vite simple qui copie les fichiers JSON de données de la démo
 * dans le dossier de sortie après le build.
 */
function copyDemoData(): Plugin {
  return {
    name: 'copy-demo-data',
    closeBundle() {
      const outDemo = resolve(__dirname, 'pages/demo');
      const srcDemo = resolve(__dirname, 'demo');
      if (!existsSync(outDemo)) mkdirSync(outDemo, { recursive: true });
      for (const file of ['data-simple.json', 'data-ministere.json', 'data-roles.json']) {
        const src = resolve(srcDemo, file);
        if (existsSync(src)) {
          cpSync(src, resolve(outDemo, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // Mode "pages" : build du site complet pour GitHub Pages (demo + grist-plugin)
  if (mode === 'pages') {
    return {
      root: '.',
      base: './',
      build: {
        outDir: 'pages',
        emptyDir: true,
        rollupOptions: {
          input: {
            demo: resolve(__dirname, 'demo/index.html'),
            grist: resolve(__dirname, 'grist-plugin/index.html'),
          },
        },
      },
      plugins: [copyDemoData()],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
    };
  }

  // Mode par défaut : build de la librairie (ES module)
  return {
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
  };
});
