import type { FileNode, TableRow } from '@/utils/validate'
import { computed, ref } from 'vue'
import { flattenFiles, toTableRows } from '@/utils/validate'

export interface TreeNode {
  label: string
  path: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

function toTreeNode(node: FileNode): TreeNode {
  const item: TreeNode = {
    label: node.name,
    path: node.path,
    type: node.type,
  }
  if (node.type === 'directory' && node.children?.length)
    item.children = node.children.map(toTreeNode)
  return item
}

/** 目录浏览、搜索、选中状态 */
export function useFileBrowser(
  getTree: () => FileNode[],
  getListing: (dirPath: string) => FileNode[],
) {
  const currentDir = ref('apps')
  const selectedFile = ref<FileNode | null>(null)
  const globalSearch = ref('')

  const fullTree = computed(() => getTree())
  const allFiles = computed(() => flattenFiles(fullTree.value))
  const isGlobalSearch = computed(() => globalSearch.value.trim().length > 0)

  /** 树形目录（默认全部展开，目录可折叠） */
  const treeData = computed(() => fullTree.value.map(toTreeNode))
  const treeCurrentKey = computed(() => selectedFile.value?.path ?? currentDir.value)

  const fileList = computed<TableRow[]>(() => {
    let list: FileNode[]
    if (isGlobalSearch.value) {
      const kw = globalSearch.value.toLowerCase().trim()
      list = allFiles.value.filter(f =>
        f.name.toLowerCase().includes(kw) || f.path.toLowerCase().includes(kw),
      )
    }
    else {
      list = getListing(currentDir.value)
    }
    return toTableRows(list)
  })

  const listTitle = computed(() =>
    isGlobalSearch.value ? `搜索结果（${fileList.value.length}）` : currentDir.value,
  )

  function findFileByPath(path: string): FileNode | null {
    return allFiles.value.find(f => f.path === path) ?? null
  }

  function selectFile(file: FileNode) {
    selectedFile.value = file
    currentDir.value = file.path.slice(0, file.path.lastIndexOf('/'))
  }

  function navigateToDir(path: string) {
    currentDir.value = path
    selectedFile.value = null
    globalSearch.value = ''
  }

  function handleTreeNodeClick(data: TreeNode) {
    if (data.type === 'directory') {
      navigateToDir(data.path)
    }
    else {
      const file = findFileByPath(data.path)
      if (file)
        selectFile(file)
    }
  }

  function handleRowClick(row: TableRow) {
    if (row.type === 'directory') {
      navigateToDir(row.path)
    }
    else {
      const file = findFileByPath(row.path)
      if (file)
        selectFile(file)
    }
  }

  return {
    currentDir,
    selectedFile,
    globalSearch,
    treeData,
    treeCurrentKey,
    fileList,
    listTitle,
    findFileByPath,
    selectFile,
    handleTreeNodeClick,
    handleRowClick,
  }
}
