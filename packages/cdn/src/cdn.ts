import type { CdnBranch, CdnDomainConfig, CdnUrlOptions } from './config'
import { CDN_CONFIG, CdnHostEnum } from './config'
import { normalizeVipMainPath } from './vip-main-path'

export type { CdnUrlOptions }

// ---------------------------------------------------------------------------
// 分支与域名
// ---------------------------------------------------------------------------

/** 默认 CDN 域名（`CDN_CONFIG.defaultHost`） */
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

/** 可选 CDN 域名列表（与 `CdnHostEnum` 对应） */
export function getCdnDomains(): readonly CdnDomainConfig[] {
  return CDN_CONFIG.domains
}

function resolveHost(host?: string): string {
  return host ?? CDN_CONFIG.defaultHost
}

function resolveBranch(branch?: CdnBranch | string): string {
  return branch ?? CDN_CONFIG.developmentBranch
}

// ---------------------------------------------------------------------------
// CDN URL 生成
// ---------------------------------------------------------------------------

/**
 * CDN apps 根路径
 * @example `https://fastly.jsdelivr.net/gh/142vip/cdn_service@next/apps`
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

/** 生产环境 CDN URL（main + 指定或默认域名） */
export function getProductionCdnUrl(relativePath: string, host?: string): string {
  return getCdnUrl(relativePath, { branch: CDN_CONFIG.productionBranch, host })
}

/** 开发环境 CDN URL（next + 指定或默认域名） */
export function getDevelopmentCdnUrl(relativePath: string, host?: string): string {
  return getCdnUrl(relativePath, { branch: CDN_CONFIG.developmentBranch, host })
}

// ---------------------------------------------------------------------------
// vip-main JSON URL
// ---------------------------------------------------------------------------

/**
 * vip-main JSON CDN URL
 * @param relativePath 相对于 `apps/vip-main/` 的路径，如 `photos.json`
 */
export function getVipMainCdnUrl(relativePath: string, options?: CdnUrlOptions): string {
  return getCdnUrl(`vip-main/${normalizeVipMainPath(relativePath)}`, options)
}

/** vip-main JSON 生产环境 CDN URL */
export function getVipMainProductionCdnUrl(relativePath: string, host?: string): string {
  return getVipMainCdnUrl(relativePath, { branch: CDN_CONFIG.productionBranch, host })
}

/** vip-main JSON 开发环境 CDN URL */
export function getVipMainDevelopmentCdnUrl(relativePath: string, host?: string): string {
  return getVipMainCdnUrl(relativePath, { branch: CDN_CONFIG.developmentBranch, host })
}

// ---------------------------------------------------------------------------
// 应用侧 CDN 配置（vip-admin / vip-main 等消费方）
// ---------------------------------------------------------------------------

const CDN_HOST_VALUES = new Set<string>(Object.values(CdnHostEnum))

/**
 * 解析应用配置的 CDN 域名；空值或不在 `CdnHostEnum` 内则回退 `fallback`
 */
export function resolveCdnHost(
  host: string | undefined,
  fallback: string = CDN_CONFIG.defaultHost,
): string {
  const trimmed = host?.trim() ?? ''
  return CDN_HOST_VALUES.has(trimmed) ? trimmed : fallback
}

/**
 * GitHub CDN 仓库根 URL（不含 `/apps`）
 * @example `https://fastly.jsdelivr.net/gh/142vip/cdn_service@main`
 */
export function buildCdnPublicBaseUrl(
  owner: string,
  repo: string,
  branch: string,
  host: string = CDN_CONFIG.defaultHost,
): string {
  return `https://${host}/gh/${owner}/${repo}@${branch}`
}

/** 本仓库生产分支根 URL（不含 `/apps`） */
export function getCdnProductionRepoRoot(host: string = CDN_CONFIG.defaultHost): string {
  return buildCdnPublicBaseUrl(
    CDN_CONFIG.repoOwner,
    CDN_CONFIG.repoName,
    getProductionBranch(),
    host,
  )
}

// ---------------------------------------------------------------------------
// URL 校验
// ---------------------------------------------------------------------------

/** URL 校验白名单：登记在 `CDN_CONFIG.domains` 的全部 host */
export function getCdnAllowedHosts(): readonly string[] {
  return CDN_CONFIG.domains.map(item => item.host)
}

/** 是否为 `cdn_service` 公开静态资源 URL（host 在白名单且路径含仓库名） */
export function isCdnServicePublicUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }
  try {
    const { hostname } = new URL(trimmed)
    if (!getCdnAllowedHosts().includes(hostname)) {
      return false
    }
    return trimmed.includes(`/${CDN_CONFIG.repoOwner}/${CDN_CONFIG.repoName}`)
  }
  catch {
    return false
  }
}
