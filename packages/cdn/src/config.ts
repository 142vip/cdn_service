/** CDN 域名配置 */
export interface CdnDomainConfig {
  label: string
  host: string
}

/** Git 分支：main 生产 / next 开发 */
export type CdnBranch = 'main' | 'next'

/** CDN URL 生成选项 */
export interface CdnUrlOptions {
  /** CDN 域名，默认见 `CDN_CONFIG.defaultHost` */
  host?: string
  /** Git 分支，默认 next */
  branch?: CdnBranch | string
}

/** CDN 镜像域名（新增域名时扩展此枚举与下方 labels） */
export enum CdnHostEnum {
  Statically = 'cdn.statically.io',
  JsDelivr = 'cdn.jsdelivr.net',
  Fastly = 'fastly.jsdelivr.net',
}

/** domains 下拉展示名，host 统一取自 `CdnHostEnum` */
const CDN_DOMAIN_LABELS: Record<CdnHostEnum, string> = {
  [CdnHostEnum.Statically]: 'Statically',
  [CdnHostEnum.JsDelivr]: 'jsDelivr',
  [CdnHostEnum.Fastly]: 'Fastly',
}

/** 由枚举生成 domains，避免 host 字符串重复维护 */
const CDN_DOMAINS: readonly CdnDomainConfig[] = (
  Object.values(CdnHostEnum) as CdnHostEnum[]
).map(host => ({
  label: CDN_DOMAIN_LABELS[host],
  host,
}))

/** CDN 仓库与域名配置 */
export interface CdnConfig {
  readonly repoOwner: string
  readonly repoName: string
  readonly appsPrefix: string
  readonly defaultHost: CdnHostEnum
  readonly productionBranch: CdnBranch
  readonly developmentBranch: CdnBranch
  readonly domains: readonly CdnDomainConfig[]
}

export const CDN_CONFIG: CdnConfig = {
  repoOwner: '142vip',
  repoName: 'cdn_service',
  appsPrefix: 'apps',
  defaultHost: CdnHostEnum.Fastly,
  productionBranch: 'main',
  developmentBranch: 'next',
  domains: CDN_DOMAINS,
}

/** npm 包名，用于 media / vip-main export 路径 */
export const PACKAGE_NAME = '@142vip/cdn' as const
