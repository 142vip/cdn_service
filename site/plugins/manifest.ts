import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { buildTreeStats, scanAppsTree } from './apps-fs'

const MANIFEST_FILE = 'manifest.json'

/** 构建前扫描 apps/ 并写入 src/assets/manifest.json，供 GitHub Pages 只读浏览 */
export function manifestPlugin(repoRoot: string): Plugin {
  const manifestPath = path.join(repoRoot, 'site/src/assets', MANIFEST_FILE)

  function writeManifest(): string {
    const tree = scanAppsTree(repoRoot)
    const content = JSON.stringify({
      generatedAt: new Date().toISOString(),
      tree,
      stats: buildTreeStats(tree),
    }, null, 2)
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
    fs.writeFileSync(manifestPath, content, 'utf-8')
    return content
  }

  return {
    name: 'cdn-manifest',
    buildStart() {
      writeManifest()
    },
    configureServer(server) {
      writeManifest()
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url.endsWith(`/${MANIFEST_FILE}`)) {
          res.setHeader('Content-Type', 'application/json')
          res.end(fs.readFileSync(manifestPath, 'utf-8'))
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: MANIFEST_FILE,
        source: fs.readFileSync(manifestPath, 'utf-8'),
      })
    },
  }
}
