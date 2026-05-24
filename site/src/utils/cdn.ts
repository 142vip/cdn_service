import {
  CDN_BRANCHES,
  CDN_DOMAINS,
  CDN_PREVIEW_BRANCH,
  CDN_PREVIEW_HOST,
  REPO_NAME,
  REPO_OWNER,
} from '@/site.config'

export interface CdnLink {
  label: string
  branch: string
  url: string
}

/** 构建单条 CDN 资源 URL */
export function buildCdnUrl(
  filePath: string,
  host: string,
  branch: string = CDN_PREVIEW_BRANCH,
): string {
  return `https://${host}/gh/${REPO_OWNER}/${REPO_NAME}@${branch}/${filePath}`
}

/** 生成所有域名 × 分支的 CDN 链接（域名在前） */
export function buildCdnLinks(filePath: string): CdnLink[] {
  const links: CdnLink[] = []
  for (const domain of CDN_DOMAINS) {
    for (const branch of CDN_BRANCHES) {
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
  branch = CDN_PREVIEW_BRANCH,
  host = CDN_PREVIEW_HOST,
): string {
  return buildCdnUrl(filePath, host, branch)
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
