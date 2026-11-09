import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  base: process.env.BASE_PATH || '/finanzas-hogar/',
  plugins: [preact()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
});
