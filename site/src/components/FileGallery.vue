<script setup lang="ts">
import type { FileNode, TableRow } from '@/utils/validate'
import { Document, Folder, Picture } from '@element-plus/icons-vue'
import { formatSize, formatSizeOrFileCount } from '@/utils/validate'

const props = defineProps<{
  items: TableRow[]
  selectedPath?: string
  isImage: (row: FileNode) => boolean
  isJson: (row: FileNode) => boolean
  previewUrl: (row: FileNode) => string
}>()

const emit = defineEmits<{
  navigate: [row: TableRow]
  select: [row: TableRow]
  preview: [file: FileNode]
}>()

function handleClick(row: TableRow) {
  if (row.type === 'directory') {
    emit('navigate', row)
    return
  }
  emit('select', row)
}

function handleDblClick(row: TableRow) {
  if (row.type === 'directory') {
    emit('navigate', row)
    return
  }
  emit('select', row)
  const file = row as FileNode
  if (props.isImage(file) || props.isJson(file))
    emit('preview', file)
}

function rowIcon(row: TableRow) {
  if (row.type === 'directory')
    return Folder
  if (props.isJson(row as FileNode))
    return Document
  return Picture
}
</script>

<template>
  <div v-if="items.length === 0" class="gallery-empty">
    <ElEmpty description="当前目录暂无内容" :image-size="72" />
  </div>
  <div v-else class="photo-wall">
    <article
      v-for="row in items"
      :key="row.path"
      class="photo-wall__item"
      :class="{
        'is-selected': selectedPath === row.path,
        'is-directory': row.type === 'directory',
        'is-json': row.type === 'file' && isJson(row as FileNode),
      }"
      @click="handleClick(row)"
      @dblclick="handleDblClick(row)"
    >
      <div v-if="row.type === 'directory'" class="photo-wall__folder">
        <ElIcon :size="36">
          <Folder />
        </ElIcon>
        <span class="photo-wall__count">{{ formatSizeOrFileCount(row) }}</span>
      </div>
      <img
        v-else-if="isImage(row as FileNode)"
        class="photo-wall__img"
        :src="previewUrl(row as FileNode)"
        :alt="row.name"
        loading="lazy"
        draggable="false"
      >
      <div v-else class="photo-wall__placeholder">
        <ElIcon :size="28">
          <component :is="rowIcon(row)" />
        </ElIcon>
        <span>{{ row.ext?.toUpperCase() }}</span>
      </div>

      <div class="photo-wall__caption">
        <span class="photo-wall__name" :title="row.name">{{ row.name }}</span>
        <span v-if="row.type === 'file'" class="photo-wall__meta">{{ formatSize(row.size) }}</span>
      </div>

      <ElTag
        v-if="row.type === 'file' && isJson(row as FileNode)"
        class="photo-wall__badge"
        size="small"
        type="info"
        effect="plain"
      >
        JSON
      </ElTag>
    </article>
  </div>
</template>
