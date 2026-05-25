import type { AllowedExtension } from '@/site.config'
import { pinyin } from 'pinyin-pro'
import { siteConfig } from '@/site.config'

export interface ValidationIssue {
  code: 'chinese' | 'naming' | 'format' | 'size'
  message: string
}

export interface RenameSuggestion {
  suggested: string
  reasons: string[]
}

export function getExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
}

export function formatSize(bytes?: number): string {
  if (bytes === undefined)
    return '-'
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function issueTagType(code: string): 'danger' | 'warning' | 'info' {
  if (code === 'chinese' || code === 'size')
    return 'danger'
  if (code === 'format')
    return 'warning'
  return 'info'
}

export function validateFile(relativePath: string, size: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fileName = relativePath.split('/').pop() ?? relativePath
  const ext = getExtension(fileName)

  if (siteConfig.chineseRegex.test(relativePath)) {
    issues.push({ code: 'chinese', message: '路径包含中文' })
  }

  if (!siteConfig.allowedExtensions.includes(ext as AllowedExtension)) {
    issues.push({ code: 'format', message: '仅允许 .jpg / .webp / .svg' })
  }

  if (!siteConfig.kebabCaseRegex.test(fileName) && !siteConfig.chineseRegex.test(fileName)) {
    issues.push({ code: 'naming', message: '需 kebab-case 命名' })
  }

  if (size > siteConfig.maxFileSize) {
    issues.push({ code: 'size', message: `超过 2MB（${formatSize(size)}）` })
  }

  return issues
}

export function validateFileName(fileName: string, size = 0): ValidationIssue[] {
  return validateFile(`apps/x/${fileName}`, size).filter(i => i.code !== 'size' || size > 0)
}

function toKebabBase(raw: string): string {
  let base = raw
    .replace(/\.[a-z0-9]{6,}$/i, '') // 去除 CDN 随机 hash 后缀
    .replace(/[\u4E00-\u9FA5]+/g, match => pinyin(match, { toneType: 'none', type: 'array' }).join('-'))
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  if (!base)
    base = 'image'

  return base
}

/** 重命名时保留原扩展名（仅 jpg/webp/svg），不强制转 webp */
function preserveRenameExtension(ext: string): string {
  if (ext === 'jpeg')
    return 'jpg'
  if (siteConfig.allowedExtensions.includes(ext as AllowedExtension))
    return ext
  return ext || 'jpg'
}

export function suggestRename(fileName: string): RenameSuggestion {
  const reasons: string[] = []
  const dotIndex = fileName.lastIndexOf('.')
  const ext = dotIndex >= 0 ? getExtension(fileName) : ''
  const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName

  if (siteConfig.chineseRegex.test(fileName))
    reasons.push('中文转为拼音')
  if (ext && !siteConfig.allowedExtensions.includes(ext as AllowedExtension))
    reasons.push(`格式 .${ext} 不符合规范，请使用转 WebP 或裁剪另存`)
  if (fileName.includes('_') || /\s/.test(fileName))
    reasons.push('空格/下划线转为中划线')
  if (fileName !== fileName.toLowerCase())
    reasons.push('统一小写')

  const suggested = `${toKebabBase(base)}.${preserveRenameExtension(ext || 'jpg')}`
  if (reasons.length === 0)
    reasons.push('符合 kebab-case 规范')

  return { suggested, reasons }
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  ext?: string
  issues: ValidationIssue[]
  children?: FileNode[]
  previewUrl?: string
}

export interface TreeStats {
  projects: number
  files: number
  issues: number
}

export function countStats(tree: FileNode[]): TreeStats {
  const files = flattenFiles(tree)
  return {
    projects: tree.length,
    files: files.length,
    issues: files.filter(f => f.issues.length > 0).length,
  }
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

export function listChildren(tree: FileNode[], dirPath: string): FileNode[] {
  if (dirPath === 'apps')
    return tree

  const parts = dirPath.replace(/^apps\/?/, '').split('/').filter(Boolean)
  let current = tree
  for (const part of parts) {
    const dir = current.find(n => n.name === part && n.type === 'directory')
    if (!dir?.children)
      return []
    current = dir.children
  }
  return current
}

/** 统计目录下文件总数（含子目录） */
export function countDirectoryFiles(node: FileNode): number {
  if (node.type === 'file' || !node.children)
    return 0
  return flattenFiles(node.children).length
}

export interface TableRow {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  ext?: string
  issues: ValidationIssue[]
  /** 目录下的文件总数 */
  fileCount?: number
}

/** 转为表格行，移除 children 以避免 el-table 树形展开 */
export function toTableRows(nodes: FileNode[]): TableRow[] {
  return nodes.map((node) => {
    const { children, ...rest } = node
    if (node.type === 'directory') {
      return {
        ...rest,
        type: 'directory',
        issues: node.issues,
        fileCount: countDirectoryFiles(node),
      }
    }
    return rest as TableRow
  })
}

export function formatSizeOrFileCount(row: TableRow): string {
  if (row.type === 'file')
    return formatSize(row.size)
  return `${row.fileCount ?? 0} 个文件`
}

/** 根据合规问题生成可操作建议 */
export function getFileSuggestion(row: TableRow): string {
  if (row.issues.length === 0)
    return '-'

  if (row.type === 'directory')
    return `重命名为 ${toKebabBase(row.name)}`

  const codes = new Set(row.issues.map(i => i.code))
  const parts: string[] = []

  if (codes.has('chinese') || codes.has('naming') || codes.has('format'))
    parts.push(suggestRename(row.name).suggested)

  if (codes.has('size'))
    parts.push('压缩至 2MB 以内')

  return parts.join(' · ')
}
