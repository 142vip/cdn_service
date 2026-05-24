import logoUrl from '@/assets/logo.svg'

export interface CdnDomainConfig {
  label: string
  host: string
}

/** 站点统一配置（CDN、规范、页脚等） */
export const siteConfig = {
  title: '142vip CDN 图床',
  homeUrl: 'https://142vip.cn',
  logo: logoUrl,
  footer: {
    icp: '鄂ICP备17025193号-1',
    icpUrl: 'https://beian.miit.gov.cn/',
    copyright: 'All Rights Reserved © 2015 - 2026 妍荣姑娘网络工作室 ✨',
  },
  baiduAnalyticsId: '18154807',

  appsPrefix: 'apps',
  maxFileSize: 2 * 1024 * 1024,
  allowedExtensions: ['jpg', 'webp', 'svg'] as const,
  kebabCaseRegex: /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|webp|svg)$/,
  chineseRegex: /[\u4E00-\u9FA5]/,
  sidebarWidth: 300,

  cdn: {
    repoOwner: '142vip',
    repoName: 'cdn_service',
    branches: ['main', 'next'] as const,
    domains: [
      { label: 'jsDelivr', host: 'cdn.jsdelivr.net' },
      { label: 'Statically', host: 'cdn.statically.io' },
      { label: 'Fastly', host: 'fastly.jsdelivr.net' },
    ] as const satisfies readonly CdnDomainConfig[],
    previewHost: 'cdn.jsdelivr.net',
    previewBranch: 'main',
  },
} as const

export const IS_LOCAL_MANAGE = import.meta.env.DEV

export const APPS_PREFIX = siteConfig.appsPrefix
export const MAX_FILE_SIZE = siteConfig.maxFileSize
export const ALLOWED_EXTENSIONS = siteConfig.allowedExtensions
export const KEBAB_CASE_REGEX = siteConfig.kebabCaseRegex
export const CHINESE_REGEX = siteConfig.chineseRegex
export const SIDEBAR_WIDTH = siteConfig.sidebarWidth

export const REPO_OWNER = siteConfig.cdn.repoOwner
export const REPO_NAME = siteConfig.cdn.repoName
export const CDN_DOMAINS = siteConfig.cdn.domains
export const CDN_BRANCHES = siteConfig.cdn.branches
export const CDN_PREVIEW_HOST = siteConfig.cdn.previewHost
export const CDN_PREVIEW_BRANCH = siteConfig.cdn.previewBranch
