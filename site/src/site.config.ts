export interface CdnDomainConfig {
  label: string
  host: string
}

/** 站点统一配置 */
export const siteConfig = {
  title: '142vip CDN 图床',
  homeUrl: 'https://142vip.cn',
  logo: new URL('./assets/logo.svg', import.meta.url).href,
  footer: {
    icp: '鄂ICP备17025193号-1',
    icpUrl: 'https://beian.miit.gov.cn/',
    copyright: 'All Rights Reserved © 2015 - 2026 妍荣姑娘网络工作室 ✨',
  },
  baiduAnalyticsId: '18154807',

  isLocalManage: import.meta.env?.DEV ?? false,

  appsPrefix: 'apps',
  maxFileSize: 2 * 1024 * 1024,
  allowedExtensions: ['jpg', 'webp', 'svg'] as const,
  kebabCaseRegex: /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|webp|svg)$/,
  chineseRegex: /[\u4E00-\u9FA5]/,
  sidebarWidth: 300,

  pages: {
    base: '/cdn_service/',
    url: 'https://142vip.github.io/cdn_service/',
  },

  cdn: {
    repoOwner: '142vip',
    repoName: 'cdn_service',
    defaultHost: 'cdn.statically.io',
    production: { branch: 'main', label: '生产' },
    development: { branch: 'next', label: '开发' },
    domains: [
      { label: 'Statically', host: 'cdn.statically.io' },
      { label: 'jsDelivr', host: 'cdn.jsdelivr.net' },
      { label: 'Fastly', host: 'fastly.jsdelivr.net' },
    ] as const satisfies readonly CdnDomainConfig[],
  },

  photoStories: {
    filePath: 'apps/vip-main/photos.json',
    categories: [
      { value: '旅游', label: '旅游', folder: 'travel' },
      { value: '运动', label: '运动', folder: 'sports' },
      { value: '做菜', label: '做菜', folder: 'cooking' },
      { value: '钓鱼', label: '钓鱼', folder: 'fishing' },
      { value: '日常', label: '日常', folder: 'daily' },
    ] as const,
  },

} as const

export type AllowedExtension = typeof siteConfig.allowedExtensions[number]
