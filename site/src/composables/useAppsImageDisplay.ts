import type { ComputedRef, Ref } from 'vue'
import { computed, ref, unref, watch } from 'vue'
import { useCdnPreviewState } from '@/composables/useCdnPreviewState'
import { localPreviewUrl } from '@/composables/useLocalFiles'
import { siteConfig } from '@/site.config'

/** apps/ 路径图片：CDN 预览 + dev 本地回退，dev / 预览 UI 一致 */
export function useAppsImageDisplay(filePath: Ref<string> | ComputedRef<string>) {
  const { branch, host, resetDefaults, buildAppsUrl, copyLink } = useCdnPreviewState()
  const imageLoaded = ref(false)
  const imageError = ref(false)
  const useLocalFallback = ref(false)

  const cdnUrl = computed(() => {
    const path = unref(filePath)
    return path ? buildAppsUrl(path) : ''
  })
  const localUrl = computed(() => {
    const path = unref(filePath)
    return path && siteConfig.isLocalManage ? localPreviewUrl(path) : ''
  })
  const displayUrl = computed(() => {
    if (useLocalFallback.value && localUrl.value)
      return localUrl.value
    return cdnUrl.value
  })

  function handleImageLoad() {
    imageLoaded.value = true
    imageError.value = false
  }

  function handleImageError() {
    if (siteConfig.isLocalManage && localUrl.value && !useLocalFallback.value) {
      useLocalFallback.value = true
      imageLoaded.value = false
      return
    }
    imageError.value = true
    imageLoaded.value = false
  }

  function resetImageState() {
    useLocalFallback.value = false
    imageLoaded.value = false
    imageError.value = false
  }

  watch([filePath, branch, host], () => {
    resetImageState()
  })

  return {
    branch,
    host,
    cdnUrl,
    displayUrl,
    imageLoaded,
    imageError,
    resetDefaults,
    resetImageState,
    copyLink,
    handleImageLoad,
    handleImageError,
  }
}
