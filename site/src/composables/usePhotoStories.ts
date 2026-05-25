import type { LifePhotoItem } from '@/types/photo-story'
import { ref } from 'vue'
import { siteConfig } from '@/site.config'
import { normalizePhotoStory, validatePhotoStory } from '@/types/photo-story'

const LOCAL_PREFIX = '/__local'

interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
}

interface PhotosResponse {
  items: LifePhotoItem[]
}

interface ManifestWithPhotos {
  photoStories?: LifePhotoItem[]
}

async function localRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const json = (await res.json()) as ApiResult<T>
  if (!json.ok)
    throw new Error(json.error ?? '操作失败')
  return json.data as T
}

/** 读写 / 只读 photos.json（dev 可编辑，预览从 manifest 读取） */
export function usePhotoStories() {
  const items = ref<LifePhotoItem[]>([])
  const selectedId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const readonly = !siteConfig.isLocalManage

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      if (siteConfig.isLocalManage) {
        const data = await localRequest<PhotosResponse>(`${LOCAL_PREFIX}/photos`)
        items.value = data.items
      }
      else {
        const res = await fetch(`${import.meta.env.BASE_URL}manifest.json`)
        if (!res.ok)
          throw new Error('manifest.json 不存在')
        const data = (await res.json()) as ManifestWithPhotos
        items.value = Array.isArray(data.photoStories) ? data.photoStories : []
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '加载照片故事失败'
    }
    finally {
      loading.value = false
    }
  }

  async function save(nextItems: LifePhotoItem[]): Promise<void> {
    if (readonly)
      throw new Error('预览模式不可编辑')

    const normalized = nextItems.map(normalizePhotoStory)
    for (const item of normalized) {
      const errors = validatePhotoStory(item)
      if (errors.length > 0)
        throw new Error(`故事 #${item.id}：${errors.join('；')}`)
    }

    saving.value = true
    error.value = ''
    try {
      const data = await localRequest<PhotosResponse>(`${LOCAL_PREFIX}/photos`, {
        method: 'PUT',
        body: JSON.stringify({ items: normalized }),
      })
      items.value = data.items
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '保存失败'
      throw err
    }
    finally {
      saving.value = false
    }
  }

  async function persist(nextItems: LifePhotoItem[]): Promise<void> {
    items.value = nextItems
    await save(nextItems)
  }

  function reorderItems(fromIndex: number, toIndex: number): LifePhotoItem[] {
    if (fromIndex === toIndex)
      return items.value
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.value.length || toIndex >= items.value.length)
      return items.value
    const next = [...items.value]
    const [row] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, row)
    return next
  }

  function jsonPreview(): string {
    return JSON.stringify(items.value, null, 2)
  }

  return {
    items,
    selectedId,
    loading,
    saving,
    error,
    readonly,
    load,
    save,
    persist,
    reorderItems,
    jsonPreview,
  }
}
