import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

/** 仓库根目录 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkgDir = path.join(repoRoot, 'packages/cdn')
/** 图床media 源目录（apps/ 下） */
const mediaSource = path.join(repoRoot, 'apps', 'media')
const mediaTarget = path.join(pkgDir, 'assets/media')
const generatedFile = path.join(pkgDir, 'src/media.generated.ts')
/** vip-main JSON 源目录 */
const vipMainSource = path.join(repoRoot, 'apps', 'vip-main')
const vipMainTarget = path.join(pkgDir, 'assets/vip-main')
const vipMainGeneratedFile = path.join(pkgDir, 'src/vip-main.generated.ts')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.webp', '.svg', '.png', '.gif'])

interface MediaTree {
  [key: string]: string | MediaTree
}

function toCamelCase(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('')
}

function resetDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory())
      copyDir(from, to)
    else if (entry.isFile())
      fs.copyFileSync(from, to)
  }
}

/** 按目录结构生成 MEDIA_SRC 树 */
function buildMediaTree(dir: string, base = ''): MediaTree {
  const tree: MediaTree = {}
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'README.md')
      continue
    const rel = base ? `${base}/${entry.name}` : entry.name
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      tree[toCamelCase(entry.name)] = buildMediaTree(abs, rel)
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!IMAGE_EXT.has(ext))
      continue
    tree[toCamelCase(entry.name)] = rel.replace(/\\/g, '/')
  }
  return tree
}

function serializeTree(node: MediaTree, indent = 2): string {
  const pad = ' '.repeat(indent)
  const lines: string[] = ['{']
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string')
      lines.push(`${pad}${key}: mediaExportPath('${value}'),`)
    else
      lines.push(`${pad}${key}: ${serializeTree(value, indent + 2)},`)
  }
  lines.push(`${' '.repeat(indent - 2)}}`)
  return lines.join('\n')
}

/** 扫描并复制 vip-main 下所有 JSON 文件 */
function syncVipMainJson(): string[] {
  if (!fs.existsSync(vipMainSource))
    throw new Error(`未找到 vip-main 源目录: ${vipMainSource}`)

  resetDir(vipMainTarget)

  const jsonFiles: string[] = []
  function scanJson(dir: string, base = ''): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'README.md')
        continue
      const rel = base ? `${base}/${entry.name}` : entry.name
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanJson(abs, rel)
        continue
      }
      if (path.extname(entry.name).toLowerCase() !== '.json')
        continue
      const normalized = rel.replace(/\\/g, '/')
      jsonFiles.push(normalized)
      const dest = path.join(vipMainTarget, normalized)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(abs, dest)
    }
  }
  scanJson(vipMainSource)

  const srcLines = jsonFiles.map((file) => {
    const key = toCamelCase(file)
    return `  ${key}: vipMainExportPath('${file}'),`
  })

  const cdnLines = jsonFiles.map((file) => {
    const key = toCamelCase(file)
    const cdnPath = `vip-main/${file}`
    return `  ${key}: {
    production: getProductionCdnUrl('${cdnPath}'),
    development: getDevelopmentCdnUrl('${cdnPath}'),
  },`
  })

  const content = [
    '/** 自动生成，请勿手改。执行 pnpm sync:cdn 更新 */',
    'import { getDevelopmentCdnUrl, getProductionCdnUrl } from \'./cdn\'',
    'import { vipMainExportPath } from \'./vip-main-path\'',
    '',
    'export const VIP_MAIN_SRC = {',
    ...srcLines,
    '} as const',
    '',
    '/** vip-main JSON 文件 CDN 链接 */',
    'export const VIP_MAIN_CDN = {',
    ...cdnLines,
    '} as const',
    '',
    '/** vip-main JSON 包内路径映射类型 */',
    'export type VipMainSrc = typeof VIP_MAIN_SRC',
    '',
    '/** vip-main JSON CDN 链接映射类型 */',
    'export type VipMainCdn = typeof VIP_MAIN_CDN',
    '',
  ].join('\n')

  fs.writeFileSync(vipMainGeneratedFile, content, 'utf-8')
  return jsonFiles
}

function main(): void {
  if (!fs.existsSync(mediaSource))
    throw new Error(`未找到media 源目录: ${mediaSource}`)

  resetDir(mediaTarget)
  copyDir(mediaSource, mediaTarget)

  const tree = buildMediaTree(mediaTarget)
  const content = [
    '/** 自动生成，请勿手改。执行 pnpm sync:cdn 更新 */',
    'import { mediaExportPath } from \'./media-path\'',
    '',
    `export const MEDIA_SRC = ${serializeTree(tree)} as const`,
    '',
    '/**media 资源路径映射类型 */',
    'export type MediaSrc = typeof MEDIA_SRC',
    '',
  ].join('\n')

  fs.writeFileSync(generatedFile, content, 'utf-8')
  const jsonFiles = syncVipMainJson()
  process.stdout.write(
    `✓ 已同步 media → packages/cdn/assets/media\n`
    + `✓ 已生成 ${path.relative(repoRoot, generatedFile)}\n`
    + `✓ 已同步 vip-main JSON → packages/cdn/assets/vip-main (${jsonFiles.join(', ')})\n`
    + `✓ 已生成 ${path.relative(repoRoot, vipMainGeneratedFile)}\n`,
  )
}

main()
