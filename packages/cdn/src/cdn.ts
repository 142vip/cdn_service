import type { CdnBranch, CdnDomainConfig, CdnUrlOptions } from './config'
import { CDN_CONFIG } from './config'
import { normalizeVipMainPath } from './vip-main-path'

export type { CdnUrlOptions }

/** 默认 CDN 域名（Statically） */
export function getDefaultCdnHost(): string {
  return CDN_CONFIG.defaultHost
}

/** 默认分支（next，开发环境） */
export function getDefaultCdnBranch(): CdnBranch {
  return CDN_CONFIG.developmentBranch
}

export function getProductionBranch(): CdnBranch {
  return CDN_CONFIG.productionBranch
}

export function getDevelopmentBranch(): CdnBranch {
  return CDN_CONFIG.developmentBranch
}

/** 可选 CDN 域名列表 */
export function getCdnDomains(): readonly CdnDomainConfig[] {
  return CDN_CONFIG.domains
}

function resolveHost(host?: string): string {
  return host ?? CDN_CONFIG.defaultHost
}

function resolveBranch(branch?: CdnBranch | string): string {
  return branch ?? CDN_CONFIG.developmentBranch
}

/**
 * CDN apps 根路径
 * @example `https://cdn.statically.io/gh/142vip/cdn_service@next/apps`
 */
export function getCdnBase(options?: CdnUrlOptions): string {
  const { repoOwner, repoName, appsPrefix } = CDN_CONFIG
  const host = resolveHost(options?.host)
  const branch = resolveBranch(options?.branch)
  return `https://${host}/gh/${repoOwner}/${repoName}@${branch}/${appsPrefix}`
}

/**
 * 完整 CDN 文件 URL
 * @param relativePath `apps/` 下相对路径，如 `media/wechat/chu-fan-code.jpg`
 */
export function getCdnUrl(relativePath: string, options?: CdnUrlOptions): string {
  const normalized = relativePath.replace(/^\/+/, '').replace(/^apps\/?/, '')
  return `${getCdnBase(options)}/${normalized}`
}

/**
 * 生产环境 CDN URL（main + 默认域名）
 */
export function getProductionCdnUrl(relativePath: string, host?: string): string {
  return getCdnUrl(relativePath, { branch: CDN_CONFIG.productionBranch, host })
}

/**
 * 开发环境 CDN URL（next + 默认域名）
 */
export function getDevelopmentCdnUrl(relativePath: string, host?: string): string {
  return getCdnUrl(relativePath, { branch: CDN_CONFIG.developmentBranch, host })
}

/**
 * vip-main 应用 JSON 文件 CDN URL
 * @param relativePath 相对于 `apps/vip-main/` 的路径，如 `photos.json`
 */
export function getVipMainCdnUrl(relativePath: string, options?: CdnUrlOptions): string {
  return getCdnUrl(`vip-main/${normalizeVipMainPath(relativePath)}`, options)
}

/**
 * vip-main 应用 JSON 生产环境 CDN URL（main + 默认域名）
 */
export function getVipMainProductionCdnUrl(relativePath: string, host?: string): string {
  return getVipMainCdnUrl(relativePath, { branch: CDN_CONFIG.productionBranch, host })
}

/**
 * vip-main 应用 JSON 开发环境 CDN URL（next + 默认域名）
 */
export function getVipMainDevelopmentCdnUrl(relativePath: string, host?: string): string {
  return getVipMainCdnUrl(relativePath, { branch: CDN_CONFIG.developmentBranch, host })
}
