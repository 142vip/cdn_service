import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { localAppsPlugin } from './plugins/local-apps'
import { manifestPlugin } from './plugins/manifest'
import { siteConfig } from './src/site.config'

const siteDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(siteDir, '..')

export default defineConfig(() => ({
  // 用 /cdn_service/，匹配 GitHub Pages 项目站
  base: siteConfig.pages.base,
  plugins: [
    vue(),
    localAppsPlugin(repoRoot),
    manifestPlugin(repoRoot),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts',
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(siteDir, 'src') },
  },
  server: {
    port: 7800,
    fs: { allow: [repoRoot] },
  },
  preview: { port: 7810 },
}))
