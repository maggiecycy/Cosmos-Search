import https from 'node:https'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const ipv4Agent = new https.Agent({ family: 4, keepAlive: true })

export default defineConfig({
  // GitHub Pages project site: set VITE_BASE=/Cosmos-Search/ in CI
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/wiki/en': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
        agent: ipv4Agent,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/wiki\/en/, ''),
      },
      '/api/wiki/zh': {
        target: 'https://zh.wikipedia.org',
        changeOrigin: true,
        agent: ipv4Agent,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/wiki\/zh/, ''),
      },
      '/api/wiki/ja': {
        target: 'https://ja.wikipedia.org',
        changeOrigin: true,
        agent: ipv4Agent,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/wiki\/ja/, ''),
      },
      '/api/wiki/commons': {
        target: 'https://commons.wikimedia.org',
        changeOrigin: true,
        agent: ipv4Agent,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/wiki\/commons/, ''),
      },
      '/api/img': {
        target: 'https://upload.wikimedia.org',
        changeOrigin: true,
        agent: ipv4Agent,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api\/img/, ''),
      },
    },
  },
})
