import { siteConfig } from '@/site.config'

export type CdnEnv = 'production' | 'development'

export interface CdnEnvSection {
  key: CdnEnv
  label: string
  branch: string
  hint: string
}

/** CDN 域名列表（新增域名只需改 site.config.ts → cdn.domains） */
export function getCdnDomains() {
  return siteConfig.cdn.domains
}

export function getDefaultCdnHost() {
  return siteConfig.cdn.defaultHost
}

/** 预览默认 next 分支 */
export function getDefaultCdnBranch() {
  return siteConfig.cdn.development.branch
}

export function getCdnBranches(): readonly [string, string] {
  return [siteConfig.cdn.production.branch, siteConfig.cdn.development.branch]
}

/** 详情面板：生产 / 开发环境（分支固定） */
export function getCdnEnvSections(): CdnEnvSection[] {
  const { production, development } = siteConfig.cdn
  return [
    { key: 'production', label: production.label, branch: production.branch, hint: '线上稳定引用' },
    { key: 'development', label: development.label, branch: development.branch, hint: '日常开发调试' },
  ]
}

export function buildCdnUrl(filePath: string, host: string, branch: string): string {
  const { repoOwner, repoName } = siteConfig.cdn
  return `https://${host}/gh/${repoOwner}/${repoName}@${branch}/${filePath}`
}

export function cdnPreviewUrl(
  filePath: string,
  branch = getDefaultCdnBranch(),
  host = getDefaultCdnHost(),
): string {
  return buildCdnUrl(filePath, host, branch)
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
