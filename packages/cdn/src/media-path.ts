import { PACKAGE_NAME } from './config'

/**
 * 生成 npm 包media 子路径，供 bundler 解析
 * @example mediaExportPath('svg/github.svg') → '@142vip/cdn/media/svg/github.svg'
 */
export function mediaExportPath(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${PACKAGE_NAME}/media/${normalized}`
}
