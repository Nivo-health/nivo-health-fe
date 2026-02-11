import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  let tailwindPlugin: unknown[] = [];
  try {
    const mod = await import('@tailwindcss/vite');
    tailwindPlugin = [mod.default()];
  } catch {
    // Keep existing build working when the dependency is unavailable locally.
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [react(), ...tailwindPlugin],
  };
});
