import type { ImageOutputFormat } from '@/utils/convert'

export interface CropNameSuggestion {
  fileName: string
  label: string
  overwrite: boolean
}

/** 末尾尺寸片段，如 -650x650、-800x600 */
const SIZE_SUFFIX_PATTERN = /(?:-\d+x\d+)+$/i

export function formatExtension(format: ImageOutputFormat): string {
  return format === 'webp' ? 'webp' : 'jpg'
}

function formatSizeSlug(width: number, height: number): string {
  return `${Math.max(1, width)}x${Math.max(1, height)}`
}

/** 去除扩展名与末尾尺寸片段，得到干净基础名 */
export function getCropSourceBase(fileName: string): string {
  let base = fileName.replace(/\.[^.]+$/, '')
  while (SIZE_SUFFIX_PATTERN.test(base))
    base = base.replace(SIZE_SUFFIX_PATTERN, '')
  base = base.replace(/-+$/, '').toLowerCase()
  return base || 'image'
}

/** 规范 kebab-case 基础名（不含尺寸后缀） */
export function getNormalizedBase(fileName: string): string {
  const base = getCropSourceBase(fileName)
  return base
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image'
}

export function buildCropNameSuggestions(options: {
  sourceFileName: string
  format: ImageOutputFormat
  width: number
  height: number
  existingFileNames?: string[]
}): CropNameSuggestion[] {
  const ext = formatExtension(options.format)
  const size = formatSizeSlug(options.width, options.height)
  const originalBase = getCropSourceBase(options.sourceFileName)
  const normalizedBase = getNormalizedBase(options.sourceFileName)
  const existing = new Set(options.existingFileNames ?? [])

  const toSuggestion = (fileName: string, label: string): CropNameSuggestion => ({
    fileName,
    label,
    overwrite: existing.has(fileName),
  })

  const suggestions: CropNameSuggestion[] = [
    toSuggestion(`${originalBase}-${size}.${ext}`, '原名 · 去除旧尺寸后追加输出尺寸'),
    toSuggestion(`${normalizedBase}-${size}.${ext}`, '规范命名 · 追加输出尺寸'),
  ]

  if (normalizedBase !== originalBase) {
    suggestions.push(
      toSuggestion(`${normalizedBase}.${ext}`, '规范命名 · 不含尺寸（短名）'),
    )
  }

  const seen = new Set<string>()
  return suggestions.filter((item) => {
    if (seen.has(item.fileName))
      return false
    seen.add(item.fileName)
    return true
  })
}

export function resolveCropFileName(
  selected: string,
  customName: string,
  suggestions: CropNameSuggestion[],
): string {
  if (selected === '__custom__')
    return customName.trim()
  return selected || suggestions[0]?.fileName || customName.trim()
}
