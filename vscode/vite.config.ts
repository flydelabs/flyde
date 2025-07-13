import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'webview-dist'),
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/webview/index.html')
    },
    sourcemap: 'inline',
  },
  root: 'src/webview',
  publicDir: false
});