// CDN URL 与配置解析
export {
  buildCdnPublicBaseUrl,
  getCdnAllowedHosts,
  getCdnBase,
  getCdnDomains,
  getCdnProductionRepoRoot,
  getCdnUrl,
  getDefaultCdnBranch,
  getDefaultCdnHost,
  getDevelopmentBranch,
  getDevelopmentCdnUrl,
  getProductionBranch,
  getProductionCdnUrl,
  getVipMainCdnUrl,
  getVipMainDevelopmentCdnUrl,
  getVipMainProductionCdnUrl,
  isCdnServicePublicUrl,
  resolveCdnHost,
} from './cdn'

// 类型与仓库配置
export type { CdnBranch, CdnConfig, CdnDomainConfig, CdnUrlOptions } from './config'
export { CDN_CONFIG, CdnHostEnum, PACKAGE_NAME } from './config'

// media 静态资源
export { mediaExportPath } from './media-path'
export type { MediaSrc } from './media.generated'
export { MEDIA_SRC } from './media.generated'

// vip-main JSON 资源
export { vipMainExportPath } from './vip-main-path'
export type { VipMainCdn, VipMainSrc } from './vip-main.generated'
export { VIP_MAIN_CDN, VIP_MAIN_SRC } from './vip-main.generated'
