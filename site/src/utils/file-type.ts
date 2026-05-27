import type { FileNode } from '@/utils/validate'
import { isRasterImage } from '@/utils/image'

export function isJsonFile(row: Pick<FileNode, 'type' | 'ext'>): boolean {
  return row.type === 'file' && row.ext === 'json'
}

export function isPreviewableFile(row: FileNode): boolean {
  return row.type === 'file' && (isRasterImage(row.ext) || row.ext === 'svg' || isJsonFile(row))
}
