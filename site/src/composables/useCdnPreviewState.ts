import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { buildCdnUrl, copyText, getDefaultCdnBranch, getDefaultCdnHost } from '@/utils/cdn'

/** 预览弹窗共用的分支 / CDN 选择与链接复制 */
export function useCdnPreviewState() {
  const branch = ref(getDefaultCdnBranch())
  const host = ref(getDefaultCdnHost())

  function resetDefaults() {
    branch.value = getDefaultCdnBranch()
    host.value = getDefaultCdnHost()
  }

  function buildAppsUrl(filePath: string) {
    return buildCdnUrl(filePath, host.value, branch.value)
  }

  async function copyLink(url: string) {
    if (!url)
      return
    try {
      await copyText(url)
      ElMessage.success('链接已复制')
    }
    catch {
      ElMessage.error('复制失败')
    }
  }

  return {
    branch,
    host,
    resetDefaults,
    buildAppsUrl,
    copyLink,
  }
}
