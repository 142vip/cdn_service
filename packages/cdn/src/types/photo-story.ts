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
