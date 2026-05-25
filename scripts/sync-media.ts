import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

/** 仓库根目录 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkgDir = path.join(repoRoot, 'packages/cdn')
/** 图床 media 源目录（apps/ 下） */
const mediaSource = path.join(repoRoot, 'apps', ' media')
const mediaTarget = path.join(pkgDir, 'assets/media')
const generatedFile = path.join(pkgDir, 'src/media.generated.ts')

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

function main(): void {
  if (!fs.existsSync(mediaSource))
    throw new Error(`未找到 media 源目录: ${mediaSource}`)

  resetDir(mediaTarget)
  copyDir(mediaSource, mediaTarget)

  const tree = buildMediaTree(mediaTarget)
  const content = [
    '/** 自动生成，请勿手改。执行 pnpm sync:cdn 更新 */',
    'import { mediaExportPath } from \'./media-path\'',
    '',
    `export const MEDIA_SRC = ${serializeTree(tree)} as const`,
    '',
    '/** media 资源路径映射类型 */',
    'export type MediaSrc = typeof MEDIA_SRC',
    '',
  ].join('\n')

  fs.writeFileSync(generatedFile, content, 'utf-8')
  process.stdout.write(`✓ 已同步 media → packages/cdn/assets/media\n✓ 已生成 ${path.relative(repoRoot, generatedFile)}\n`)
}

main()
