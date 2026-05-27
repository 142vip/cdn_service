import { ref } from 'vue'
import { buildCdnUrl, getDefaultCdnBranch, getDefaultCdnHost } from '@/utils/cdn'

/** 预览弹窗共用的分支 / CDN 选择 */
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

  return {
    branch,
    host,
    resetDefaults,
    buildAppsUrl,
  }
}
