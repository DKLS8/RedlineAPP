import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  define: {
    'process.env': {
      GOOGLE_LOGGING_DISABLE_COLORS: JSON.stringify('true')
    },
    'global': {}
  },
  server: {
    proxy: {
      '/api/v2/campaigns/analytics': {
        target: 'https://api.instantly.ai',
        changeOrigin: true,
        secure: false,
        headers: {
          'Authorization': 'Bearer OTBhMjYxMDktNTE2Yy00NTg2LTk5ZTEtYmEzNWE1MWJjOGU0Omt3ZG1QbUlDc0lKYQ==',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'googleapis': ['googleapis', 'google-auth-library']
        }
      }
    }
  }
});