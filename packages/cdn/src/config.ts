/** CDN 域名配置 */
export interface CdnDomainConfig {
  label: string
  host: string
}

/** Git 分支：main 生产 / next 开发 */
export type CdnBranch = 'main' | 'next'

/** CDN URL 生成选项 */
export interface CdnUrlOptions {
  /** CDN 域名，默认 Statically */
  host?: string
  /** Git 分支，默认 next */
  branch?: CdnBranch | string
}

/** CDN 仓库与域名（新增域名只需扩展 domains） */
export interface CdnConfig {
  readonly repoOwner: string
  readonly repoName: string
  readonly appsPrefix: string
  readonly defaultHost: string
  readonly productionBranch: CdnBranch
  readonly developmentBranch: CdnBranch
  readonly domains: readonly CdnDomainConfig[]
}

export const CDN_CONFIG: CdnConfig = {
  repoOwner: '142vip',
  repoName: 'cdn_service',
  appsPrefix: 'apps',
  defaultHost: 'cdn.statically.io',
  productionBranch: 'main',
  developmentBranch: 'next',
  domains: [
    { label: 'Statically', host: 'cdn.statically.io' },
    { label: 'jsDelivr', host: 'cdn.jsdelivr.net' },
    { label: 'Fastly', host: 'fastly.jsdelivr.net' },
  ],
}

/** npm 包名，用于media export 路径 */
export const PACKAGE_NAME = '@142vip/cdn' as const
