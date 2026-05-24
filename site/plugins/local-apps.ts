import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import {
  APPS_DIR,
  buildTreeStats,
  deleteAppsFile,
  getAppsAbsolutePath,
  renameAppsFile,
  scanAppsTree,
  writeAppsFile,
} from './apps-fs'

interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

async function readBody(req: IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      }
      catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: ApiResponse): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/** dev 专用中间件：读写当前仓库 apps/ 目录 */
function createLocalAppsMiddleware(repoRoot: string): Connect.NextHandleFunction {
  const appsPath = getAppsAbsolutePath(repoRoot)

  return async (req, res, next) => {
    if (!req.url)
      return next()

    const urlPath = req.url.split('?')[0]

    // 静态预览 apps/ 下图片
    if (req.method === 'GET' && urlPath.startsWith('/apps/')) {
      const relativePath = decodeURIComponent(urlPath.slice('/apps/'.length))
      const filePath = path.join(appsPath, relativePath)

      if (!filePath.startsWith(appsPath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory())
        return next()

      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
      }
      res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream')
      fs.createReadStream(filePath).pipe(res)
      return
    }

    if (!urlPath.startsWith('/__local/'))
      return next()

    try {
      if (req.method === 'GET' && urlPath === '/__local/tree') {
        const tree = scanAppsTree(repoRoot)
        sendJson(res, 200, {
          ok: true,
          data: { tree, stats: buildTreeStats(tree), appsPath: APPS_DIR },
        })
        return
      }

      if (req.method === 'POST' && urlPath === '/__local/rename') {
        const body = await readBody(req)
        const newPath = renameAppsFile(repoRoot, body.oldPath, body.newName)
        sendJson(res, 200, { ok: true, data: { newPath } })
        return
      }

      if (req.method === 'DELETE' && urlPath === '/__local/file') {
        const body = await readBody(req)
        deleteAppsFile(repoRoot, body.path)
        sendJson(res, 200, { ok: true })
        return
      }

      if (req.method === 'POST' && urlPath === '/__local/write') {
        const body = await readBody(req)
        writeAppsFile(repoRoot, body.path, Buffer.from(body.base64, 'base64'))
        sendJson(res, 200, { ok: true })
        return
      }

      sendJson(res, 404, { ok: false, error: 'Not found' })
    }
    catch (error) {
      sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}

/** dev 模式插件：挂载本地 apps/ 读写中间件 */
export function localAppsPlugin(repoRoot: string): Plugin {
  return {
    name: 'local-apps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(createLocalAppsMiddleware(repoRoot))
    },
  }
}
