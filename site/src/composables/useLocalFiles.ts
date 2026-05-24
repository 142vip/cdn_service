import type { CompressResult } from '@/utils/convert'
import type { FileNode } from '@/utils/validate'
import { ref } from 'vue'
import {
  convertImageBlob,
  formatQuality,
  replaceExtension,
} from '@/utils/convert'
import {
  countStats,
  listChildren,
  validateFileName,
} from '@/utils/validate'

const LOCAL_PREFIX = '/__local'

interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
}

interface TreeResponse {
  tree: FileNode[]
  stats: ReturnType<typeof countStats>
  appsPath: string
}

export interface SaveFileResult {
  path: string
  size: number
  quality?: number
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

export function localPreviewUrl(filePath: string): string {
  const relative = filePath.replace(/^apps\//, '')
  return `/apps/${relative.split('/').map(encodeURIComponent).join('/')}`
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function writeBlob(filePath: string, blob: Blob): Promise<void> {
  const base64 = await blobToBase64(blob)
  await localRequest(`${LOCAL_PREFIX}/write`, {
    method: 'POST',
    body: JSON.stringify({ path: filePath, base64 }),
  })
}

/** 本地 dev 模式：通过 Vite 中间件管理当前仓库 apps/ 目录 */
export function useLocalFiles() {
  const tree = ref<FileNode[]>([])
  const stats = ref(countStats([]))
  const ready = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const data = await localRequest<TreeResponse>(`${LOCAL_PREFIX}/tree`)
      tree.value = data.tree
      stats.value = data.stats
      ready.value = true
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '加载 apps/ 目录失败'
      ready.value = false
    }
    finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<void> {
    await load()
  }

  function getDirectoryListing(dirPath: string): FileNode[] {
    return listChildren(tree.value, dirPath)
  }

  async function renameFile(filePath: string, newName: string): Promise<void> {
    const issues = validateFileName(newName)
    if (issues.length > 0)
      throw new Error(issues.map(i => i.message).join('；'))

    await localRequest(`${LOCAL_PREFIX}/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldPath: filePath, newName }),
    })
    await refresh()
  }

  async function deleteFile(filePath: string): Promise<void> {
    await localRequest(`${LOCAL_PREFIX}/file`, {
      method: 'DELETE',
      body: JSON.stringify({ path: filePath }),
    })
    await refresh()
  }

  /** 另存为新文件（裁剪、导出等） */
  async function saveNewFile(dirPath: string, fileName: string, blob: Blob): Promise<SaveFileResult> {
    const issues = validateFileName(fileName, blob.size)
    if (issues.length > 0)
      throw new Error(issues.map(i => i.message).join('；'))

    const filePath = `${dirPath}/${fileName}`
    await writeBlob(filePath, blob)
    await refresh()
    return { path: filePath, size: blob.size }
  }

  /** 格式转换 + 智能压缩，默认替换原文件为 webp */
  async function convertToWebpFile(filePath: string, replaceOriginal = true): Promise<SaveFileResult & { quality: number }> {
    const fileName = filePath.split('/').pop() ?? ''
    const dir = filePath.slice(0, filePath.lastIndexOf('/'))
    const newName = replaceExtension(fileName, 'webp')
    const newPath = `${dir}/${newName}`

    const res = await fetch(localPreviewUrl(filePath))
    if (!res.ok)
      throw new Error('读取源文件失败')

    const converted: CompressResult = await convertImageBlob(await res.blob(), 'webp')
    await writeBlob(newPath, converted.blob)

    if (replaceOriginal && newPath !== filePath) {
      await localRequest(`${LOCAL_PREFIX}/file`, {
        method: 'DELETE',
        body: JSON.stringify({ path: filePath }),
      })
    }

    await refresh()
    return {
      path: newPath,
      size: converted.blob.size,
      quality: converted.quality,
    }
  }

  return {
    tree,
    stats,
    ready,
    loading,
    error,
    load,
    refresh,
    getDirectoryListing,
    renameFile,
    deleteFile,
    saveNewFile,
    convertToWebpFile,
    formatQuality,
  }
}
