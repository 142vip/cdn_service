/** 142vip.cn 照片墙单条故事数据，对应 apps/vip-main/photos.json */
export interface LifePhotoItem {
  id: number
  title: string
  description: string
  images: string[]
  category: string
  date: string
  location?: string
  tags?: string[]
}

const REMOTE_IMAGE_PATTERN = /^https?:\/\//i
const IMAGE_EXT_PATTERN = /\.(?:jpe?g|webp|png|gif|svg)(?:[?#]|$)/i

/** 解析故事图片地址：外链原样返回，图床路径走 resolver */
export function resolveStoryImageUrl(
  path: string,
  resolver: (filePath: string) => string,
): string {
  if (!path)
    return ''
  if (REMOTE_IMAGE_PATTERN.test(path))
    return path
  return resolver(path)
}

export function isStoryImagePreviewable(path: string): boolean {
  if (!path)
    return false
  if (REMOTE_IMAGE_PATTERN.test(path))
    return IMAGE_EXT_PATTERN.test(path) || path.includes('images.unsplash.com')
  const fileName = path.split('/').pop() ?? path
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : ''
  return ['jpg', 'jpeg', 'webp', 'png', 'gif', 'svg'].includes(ext)
}

export function createEmptyPhotoStory(nextId: number): LifePhotoItem {
  return {
    id: nextId,
    title: '',
    description: '',
    images: [''],
    category: '日常',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    tags: [],
  }
}

export function nextPhotoStoryId(items: LifePhotoItem[]): number {
  if (items.length === 0)
    return 1
  return Math.max(...items.map(item => item.id)) + 1
}

export function normalizePhotoStory(raw: LifePhotoItem): LifePhotoItem {
  return {
    id: raw.id,
    title: raw.title.trim(),
    description: raw.description.trim(),
    images: raw.images.map(s => s.trim()).filter(Boolean),
    category: raw.category.trim(),
    date: raw.date.trim(),
    location: raw.location?.trim() || undefined,
    tags: raw.tags?.map(t => t.trim()).filter(Boolean),
  }
}

export function validatePhotoStory(item: LifePhotoItem): string[] {
  const errors: string[] = []
  if (!item.title)
    errors.push('标题不能为空')
  if (!item.description)
    errors.push('描述不能为空')
  if (!item.category)
    errors.push('请选择分类')
  if (!item.date)
    errors.push('请填写日期')
  if (item.images.length === 0)
    errors.push('至少添加一张图片')
  return errors
}
