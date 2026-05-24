export interface CropRatioPreset {
  label: string
  /** NaN 表示自由裁剪 */
  value: number
}

export const CROP_RATIO_PRESETS: CropRatioPreset[] = [
  { label: '自由', value: Number.NaN },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
  { label: '4:5', value: 4 / 5 },
  { label: '5:4', value: 5 / 4 },
  { label: '21:9', value: 21 / 9 },
]

export const RASTER_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
export const CONVERTIBLE_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const

export function isRasterImage(ext?: string): boolean {
  return RASTER_IMAGE_EXTENSIONS.includes(ext as typeof RASTER_IMAGE_EXTENSIONS[number])
}

export function isConvertibleImage(ext?: string): boolean {
  return CONVERTIBLE_EXTENSIONS.includes(ext as typeof CONVERTIBLE_EXTENSIONS[number])
}

export function isCropableImage(ext?: string): boolean {
  return isRasterImage(ext)
}
