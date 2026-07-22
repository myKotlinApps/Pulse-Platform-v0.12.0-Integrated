import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(import.meta.dirname, '../shared'),
  server: { port: 5174, host: true },
});
