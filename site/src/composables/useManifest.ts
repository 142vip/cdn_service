import type { FileNode } from '@/utils/validate'
import { ref } from 'vue'
import { countStats, listChildren } from '@/utils/validate'

interface ManifestData {
  generatedAt: string
  tree: FileNode[]
  stats: ReturnType<typeof countStats>
}

export function useManifest() {
  const tree = ref<FileNode[]>([])
  const stats = ref(countStats([]))
  const generatedAt = ref('')
  const loading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}manifest.json`)
      if (!res.ok)
        throw new Error('manifest.json 不存在，请先执行 pnpm site:build')
      const data = (await res.json()) as ManifestData
      tree.value = data.tree
      stats.value = data.stats
      generatedAt.value = data.generatedAt
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败'
    }
    finally {
      loading.value = false
    }
  }

  function getDirectoryListing(dirPath: string): FileNode[] {
    return listChildren(tree.value, dirPath)
  }

  return {
    tree,
    stats,
    generatedAt,
    loading,
    error,
    load,
    getDirectoryListing,
  }
}
