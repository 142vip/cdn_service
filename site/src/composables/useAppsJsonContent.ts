import type { ComputedRef, Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'
import { useCdnPreviewState } from '@/composables/useCdnPreviewState'
import { localPreviewUrl } from '@/composables/useLocalFiles'
import { siteConfig } from '@/site.config'

function formatJsonText(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  }
  catch {
    return raw
  }
}

/** apps/ JSON 文件：CDN 拉取 + dev 本地回退 */
export function useAppsJsonContent(
  filePath: Ref<string> | ComputedRef<string>,
  enabled: Ref<boolean> | ComputedRef<boolean>,
) {
  const { branch, host, resetDefaults, buildAppsUrl } = useCdnPreviewState()
  const loading = ref(false)
  const error = ref('')
  const rawContent = ref('')

  const cdnUrl = computed(() => {
    const path = unref(filePath)
    return path ? buildAppsUrl(path) : ''
  })

  const displayText = computed(() => formatJsonText(rawContent.value))

  async function load() {
    const path = unref(filePath)
    if (!unref(enabled) || !path) {
      rawContent.value = ''
      error.value = ''
      return
    }

    loading.value = true
    error.value = ''
    const sources = siteConfig.isLocalManage
      ? [localPreviewUrl(path), buildAppsUrl(path)]
      : [buildAppsUrl(path)]

    try {
      for (const url of sources) {
        try {
          const response = await fetch(url)
          if (!response.ok)
            continue
          rawContent.value = await response.text()
          return
        }
        catch {
          // try next source
        }
      }
      rawContent.value = ''
      error.value = 'JSON 加载失败，请检查 CDN 链接或本地文件'
    }
    finally {
      loading.value = false
    }
  }

  function resetState() {
    rawContent.value = ''
    error.value = ''
    loading.value = false
  }

  watch([filePath, branch, host, enabled], () => {
    load()
  })

  return {
    branch,
    host,
    cdnUrl,
    loading,
    error,
    displayText,
    resetDefaults,
    resetState,
  }
}
