import { PACKAGE_NAME } from './config'

export function normalizeVipMainPath(relativePath: string): string {
  return relativePath
    .replace(/^\/+/, '')
    .replace(/^apps\/vip-main\/?/, '')
    .replace(/^vip-main\/?/, '')
    .replace(/\\/g, '/')
}

/**
 * 生成 npm 包 vip-main 子路径，供 bundler 解析
 * @example vipMainExportPath('photos.json') → '@142vip/cdn/vip-main/photos.json'
 */
export function vipMainExportPath(relativePath: string): string {
  return `${PACKAGE_NAME}/vip-main/${normalizeVipMainPath(relativePath)}`
}
