import type { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

/** apps/ 目录名，所有文件操作均锁定在此目录下 */
export const APPS_DIR = 'apps'

export interface ValidationIssue {
  code: string
  message: string
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  ext?: string
  issues: ValidationIssue[]
  children?: FileNode[]
}

const MAX_FILE_SIZE = 2 * 1024 * 1024
const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|webp|svg)$/
const CHINESE_REGEX = /[\u4E00-\u9FA5]/
const ALLOWED = ['jpg', 'webp', 'svg']

export function getAppsAbsolutePath(repoRoot: string): string {
  return path.join(repoRoot, APPS_DIR)
}

export function assertAppsPath(relativePath: string): string {
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, '/'))
  if (
    normalized.includes('..')
    || (!normalized.startsWith(`${APPS_DIR}/`) && normalized !== APPS_DIR)
  ) {
    throw new Error('仅允许操作当前仓库 apps/ 目录')
  }
  return normalized
}

export function resolveAppsAbsolute(repoRoot: string, relativePath: string): string {
  const safePath = assertAppsPath(relativePath)
  const absolutePath = path.join(repoRoot, safePath)
  const appsRoot = getAppsAbsolutePath(repoRoot)

  if (!absolutePath.startsWith(appsRoot))
    throw new Error('路径越界')

  return absolutePath
}

function validateFile(relativePath: string, size: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fileName = path.basename(relativePath)
  const ext = path.extname(fileName).slice(1).toLowerCase()

  if (CHINESE_REGEX.test(relativePath))
    issues.push({ code: 'chinese', message: '路径包含中文' })
  if (!ALLOWED.includes(ext))
    issues.push({ code: 'format', message: '仅允许 .jpg / .webp / .svg' })
  if (!KEBAB_CASE_REGEX.test(fileName) && !CHINESE_REGEX.test(fileName))
    issues.push({ code: 'naming', message: '需 kebab-case 命名' })
  if (size > MAX_FILE_SIZE)
    issues.push({ code: 'size', message: '超过 2MB' })

  return issues
}

function validateFileName(fileName: string): ValidationIssue[] {
  return validateFile(`${APPS_DIR}/x/${fileName}`, 0)
}

function buildTree(repoRoot: string, relativePath: string): FileNode {
  const absolutePath = path.join(repoRoot, relativePath)
  const name = path.basename(relativePath)
  const stat = fs.statSync(absolutePath)

  if (stat.isDirectory()) {
    const children = fs.readdirSync(absolutePath, { withFileTypes: true })
      .filter(e => e.name !== 'README.md')
      .map(e => buildTree(repoRoot, `${relativePath}/${e.name}`))
      .sort((a, b) => {
        if (a.type !== b.type)
          return a.type === 'directory' ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return {
      name,
      path: relativePath.replace(/\\/g, '/'),
      type: 'directory',
      issues: CHINESE_REGEX.test(relativePath) ? [{ code: 'chinese', message: '目录名异常' }] : [],
      children,
    }
  }

  const size = stat.size
  const ext = path.extname(name).slice(1).toLowerCase()
  return {
    name,
    path: relativePath.replace(/\\/g, '/'),
    type: 'file',
    size,
    ext,
    issues: validateFile(relativePath.replace(/\\/g, '/'), size),
  }
}

export function scanAppsTree(repoRoot: string): FileNode[] {
  const appsPath = getAppsAbsolutePath(repoRoot)
  if (!fs.existsSync(appsPath))
    throw new Error('当前仓库未找到 apps/ 目录')

  return fs.readdirSync(appsPath, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => buildTree(repoRoot, `${APPS_DIR}/${e.name}`))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  for (const node of nodes) {
    if (node.type === 'file')
      result.push(node)
    if (node.children)
      result.push(...flattenFiles(node.children))
  }
  return result
}

export function buildTreeStats(tree: FileNode[]) {
  const files = flattenFiles(tree)
  return {
    projects: tree.length,
    files: files.length,
    issues: files.filter(f => f.issues.length > 0).length,
  }
}

export function renameAppsFile(repoRoot: string, oldPath: string, newName: string): string {
  const issues = validateFileName(newName)
  if (issues.length > 0)
    throw new Error(issues.map(i => i.message).join('；'))

  const safeOldPath = assertAppsPath(oldPath)
  const dir = path.posix.dirname(safeOldPath)
  const newPath = `${dir}/${newName}`
  assertAppsPath(newPath)

  const oldAbs = resolveAppsAbsolute(repoRoot, safeOldPath)
  const newAbs = resolveAppsAbsolute(repoRoot, newPath)

  if (!fs.existsSync(oldAbs))
    throw new Error('源文件不存在')
  if (fs.statSync(oldAbs).isDirectory())
    throw new Error('不支持重命名目录')
  if (fs.existsSync(newAbs))
    throw new Error('目标文件名已存在')

  fs.renameSync(oldAbs, newAbs)
  return newPath
}

export function deleteAppsFile(repoRoot: string, relativePath: string): void {
  const absolutePath = resolveAppsAbsolute(repoRoot, relativePath)

  if (!fs.existsSync(absolutePath))
    throw new Error('文件不存在')
  if (fs.statSync(absolutePath).isDirectory())
    throw new Error('不支持删除目录')

  fs.unlinkSync(absolutePath)
}

export function writeAppsFile(repoRoot: string, relativePath: string, buffer: Buffer): void {
  const issues = validateFileName(path.basename(relativePath))
  if (issues.length > 0)
    throw new Error(issues.map(i => i.message).join('；'))

  const absolutePath = resolveAppsAbsolute(repoRoot, relativePath)
  if (buffer.length > MAX_FILE_SIZE)
    throw new Error('文件大小超过 2MB')

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, buffer)
}
