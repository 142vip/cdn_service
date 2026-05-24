export const MAX_FILE_SIZE = 2 * 1024 * 1024
const DEFAULT_QUALITY = 0.85
const MIN_QUALITY = 0.55

export type ImageOutputFormat = 'webp' | 'jpeg'

export interface CompressResult {
  blob: Blob
  quality: number
  width: number
  height: number
}

export interface CompressOptions {
  format: ImageOutputFormat
  maxSize?: number
  quality?: number
  maxDimension?: number
}

export function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.')
  const base = dot >= 0 ? fileName.slice(0, dot) : fileName
  return `${base}.${newExt.replace(/^\./, '')}`
}

export async function loadImageToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('无法创建 Canvas 上下文')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageOutputFormat, quality: number): Promise<Blob> {
  const mime = format === 'webp' ? 'image/webp' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('图片导出失败')),
      mime,
      quality,
    )
  })
}

function resizeCanvas(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('无法创建 Canvas 上下文')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return canvas
}

/** 在保证质量的前提下压缩至 maxSize 以内 */
export async function compressCanvas(
  source: HTMLCanvasElement,
  options: CompressOptions,
): Promise<CompressResult> {
  const maxSize = options.maxSize ?? MAX_FILE_SIZE
  const maxDimension = options.maxDimension ?? 4096
  let quality = options.quality ?? DEFAULT_QUALITY

  let width = source.width
  let height = source.height
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  let workCanvas = width === source.width && height === source.height
    ? source
    : resizeCanvas(source, width, height)

  for (let attempt = 0; attempt < 14; attempt++) {
    const blob = await canvasToBlob(workCanvas, options.format, quality)
    if (blob.size <= maxSize) {
      return { blob, quality, width: workCanvas.width, height: workCanvas.height }
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.06)
      continue
    }

    width = Math.max(320, Math.round(workCanvas.width * 0.88))
    height = Math.max(320, Math.round(workCanvas.height * 0.88))
    workCanvas = resizeCanvas(workCanvas, width, height)
    quality = DEFAULT_QUALITY
  }

  throw new Error('无法将图片压缩到 2MB 以内，请缩小裁剪区域')
}

/** 格式转换 + 智能压缩 */
export async function convertImageBlob(blob: Blob, format: ImageOutputFormat = 'webp'): Promise<CompressResult> {
  const canvas = await loadImageToCanvas(blob)
  return compressCanvas(canvas, { format })
}

/** @deprecated 使用 convertImageBlob */
export async function convertJpgToWebp(file: Blob, quality = 0.85): Promise<Blob> {
  const canvas = await loadImageToCanvas(file)
  const result = await compressCanvas(canvas, { format: 'webp', quality })
  return result.blob
}

export function formatQuality(quality: number): string {
  return `${Math.round(quality * 100)}%`
}
