import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/lib/hooks'),
      '@api': path.resolve(__dirname, './src/lib/api'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/lib/types'),
      '@utils': path.resolve(__dirname, './src/lib/utils'),
      '@stores': path.resolve(__dirname, './src/lib/stores'),
      '@data': path.resolve(__dirname, './src/data'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@layouts': path.resolve(__dirname, './src/layouts')
    }
  },
  server: {
    // Cloudflare quick tunnels rotate URLs every restart.
    // Allow any trycloudflare.com subdomain during development.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
    host: true,

    port: 5173
    // Proxy removed - using mock data only
  }
});
