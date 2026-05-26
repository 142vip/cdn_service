<script setup lang="ts">
import type { FileNode } from '@/utils/validate'
import { Loading } from '@element-plus/icons-vue'
import { computed, watch } from 'vue'
import CdnPreviewBar from '@/components/CdnPreviewBar.vue'
import { useAppsImageDisplay } from '@/composables/useAppsImageDisplay'

const props = defineProps<{
  visible: boolean
  file: FileNode | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const filePath = computed(() =>
  props.file?.type === 'file' ? props.file.path : '',
)

const {
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
} = useAppsImageDisplay(filePath)

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

watch(() => props.visible, (open) => {
  if (open) {
    resetDefaults()
    resetImageState()
  }
})

function handleCopyLink() {
  copyLink(cdnUrl.value)
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    class="image-preview-dialog"
    destroy-on-close
    append-to-body
    align-center
  >
    <template #header>
      <span class="preview-title">{{ file?.name ?? '图片预览' }}</span>
    </template>

    <CdnPreviewBar
      v-if="filePath"
      v-model:branch="branch"
      v-model:host="host"
      :file-path="filePath"
      :cdn-url="cdnUrl"
      theme="light"
      @copy="handleCopyLink"
    />

    <div class="preview-stage">
      <div v-if="!imageLoaded && !imageError && displayUrl" class="preview-loading">
        <ElIcon class="is-loading">
          <Loading />
        </ElIcon>
      </div>
      <img
        v-show="imageLoaded && !imageError"
        :src="displayUrl"
        :alt="file?.name"
        class="preview-img"
        @load="handleImageLoad"
        @error="handleImageError"
      >
      <ElEmpty v-if="imageError" description="图片加载失败，请检查 CDN 链接" />
    </div>
  </ElDialog>
</template>

<style scoped>
.preview-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 120px;
  max-height: min(72vh, 820px);
  margin-top: 12px;
  padding: 12px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  color: var(--el-text-color-secondary);
}

.preview-img {
  display: block;
  width: auto;
  height: auto;
  max-width: min(100%, 820px);
  max-height: min(68vh, 780px);
  object-fit: contain;
}
</style>

<style>
.image-preview-dialog.el-dialog {
  width: auto;
  max-width: min(92vw, 900px);
  margin: 0 auto;
}

.image-preview-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
