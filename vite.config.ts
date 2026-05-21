import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildId = process.env.VITE_BUILD_ID || String(Date.now())

/** После сборки подставляет hashed splash-logo в index.html (boot-splash). */
function injectBootSplashLogo(): Plugin {
  return {
    name: 'inject-boot-splash-logo',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        const base = process.env.VITE_BASE_PATH || '/'
        let out = html
        for (const item of Object.values(bundle)) {
          if (item.type !== 'asset' || !item.fileName) continue
          const fileName = item.fileName
          const url = `${base}${fileName}`.replace(/\/{2,}/g, '/')
          if (fileName.includes('splash-logo')) {
            out = out.replace(/\/images\/splash-logo\.png/g, url)
          }
        }
        return out
          .replace(
            'object-fit: cover',
            'object-fit: contain; background: transparent; border-radius: 0',
          )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectBootSplashLogo()],
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
