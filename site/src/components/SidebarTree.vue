<script setup lang="ts">
import type { TreeNode } from '@/composables/useFileBrowser'
import { Folder, Picture } from '@element-plus/icons-vue'

defineProps<{
  data: TreeNode[]
  currentKey: string
}>()

const emit = defineEmits<{
  nodeClick: [node: TreeNode]
}>()
</script>

<template>
  <ElTree
    class="sidebar-tree"
    :data="data"
    node-key="path"
    default-expand-all
    highlight-current
    :current-node-key="currentKey"
    :expand-on-click-node="false"
    @node-click="(node: TreeNode) => emit('nodeClick', node)"
  >
    <template #default="{ data: node }">
      <span class="tree-node" :class="node.type === 'directory' ? 'tree-dir' : 'tree-file'">
        <ElIcon><component :is="node.type === 'directory' ? Folder : Picture" /></ElIcon>
        <span class="tree-label">{{ node.label }}</span>
      </span>
    </template>
  </ElTree>
</template>

<style scoped>
.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
