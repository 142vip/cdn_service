/** 自动生成，请勿手改。执行 pnpm sync:cdn 更新 */
import { getDevelopmentCdnUrl, getProductionCdnUrl } from './cdn'
import { vipMainExportPath } from './vip-main-path'

export const VIP_MAIN_SRC = {
  photos: vipMainExportPath('photos.json'),
} as const

/** vip-main JSON 文件 CDN 链接 */
export const VIP_MAIN_CDN = {
  photos: {
    production: getProductionCdnUrl('vip-main/photos.json'),
    development: getDevelopmentCdnUrl('vip-main/photos.json'),
  },
} as const

/** vip-main JSON 包内路径映射类型 */
export type VipMainSrc = typeof VIP_MAIN_SRC

/** vip-main JSON CDN 链接映射类型 */
export type VipMainCdn = typeof VIP_MAIN_CDN
