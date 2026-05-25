import { siteConfig } from '@/site.config'

export interface CdnLink {
  label: string
  branch: string
  url: string
}

/** 构建单条 CDN 资源 URL */
export function buildCdnUrl(
  filePath: string,
  host: string,
  branch: string = siteConfig.cdn.previewBranch,
): string {
  const { repoOwner, repoName } = siteConfig.cdn
  return `https://${host}/gh/${repoOwner}/${repoName}@${branch}/${filePath}`
}

/** 生成所有域名 × 分支的 CDN 链接（域名在前） */
export function buildCdnLinks(filePath: string): CdnLink[] {
  const links: CdnLink[] = []
  for (const domain of siteConfig.cdn.domains) {
    for (const branch of siteConfig.cdn.branches) {
      links.push({
        label: `${domain.label} (${branch})`,
        branch,
        url: buildCdnUrl(filePath, domain.host, branch),
      })
    }
  }
  return links
}

/** 线上预览默认 CDN URL */
export function cdnPreviewUrl(
  filePath: string,
  branch = siteConfig.cdn.previewBranch,
  host = siteConfig.cdn.previewHost,
): string {
  return buildCdnUrl(filePath, host, branch)
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
