import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode singlefile` inlines every JS/CSS chunk into dist-singlefile/index.html so the
// demo can be opened from disk (file://) or dropped into a doc store without a server.
export default defineConfig(({ mode }) => {
  const singleFile = mode === 'singlefile';
  return {
    base: './',
    plugins: [react(), ...(singleFile ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    define: {
      // EUI and some deps read process.env.NODE_ENV at runtime.
      'process.env.NODE_ENV': JSON.stringify(singleFile ? 'production' : mode),
    },
    build: {
      outDir: singleFile ? 'dist-singlefile' : 'dist',
      emptyOutDir: true,
      target: 'es2020',
      chunkSizeWarningLimit: 6000,
    },
    server: {
      strictPort: true,
    },
  };
});
