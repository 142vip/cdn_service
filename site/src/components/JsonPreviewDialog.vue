<script setup lang="ts">
import type { FileNode } from '@/utils/validate'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, watch } from 'vue'
import CdnPreviewBar from '@/components/CdnPreviewBar.vue'
import { useAppsJsonContent } from '@/composables/useAppsJsonContent'
import { copyText } from '@/utils/cdn'

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

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const enabled = computed(() => dialogVisible.value)

const {
  branch,
  host,
  cdnUrl,
  loading,
  error,
  displayText,
  resetDefaults,
  resetState,
} = useAppsJsonContent(filePath, enabled)

watch(() => props.visible, (open) => {
  if (open) {
    resetDefaults()
    resetState()
  }
})

async function handleCopyContent() {
  if (!displayText.value)
    return
  try {
    await copyText(displayText.value)
    ElMessage.success('JSON 内容已复制')
  }
  catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    class="json-preview-dialog"
    destroy-on-close
    append-to-body
    align-center
  >
    <template #header>
      <div class="json-preview-dialog__header">
        <span class="preview-title">{{ file?.name ?? 'JSON 预览' }}</span>
        <ElButton
          v-if="displayText"
          plain
          :icon="CopyDocument"
          @click="handleCopyContent"
        >
          复制内容
        </ElButton>
      </div>
    </template>

    <CdnPreviewBar
      v-if="filePath"
      v-model:branch="branch"
      v-model:host="host"
      :file-path="filePath"
      :cdn-url="cdnUrl"
      theme="light"
    />

    <div v-loading="loading" class="json-preview-dialog__body">
      <ElEmpty v-if="error" :description="error" />
      <ElScrollbar v-else max-height="min(68vh, 720px)">
        <pre class="json-preview-dialog__code">{{ displayText || ' ' }}</pre>
      </ElScrollbar>
    </div>
  </ElDialog>
</template>

<style scoped>
.json-preview-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 28px;
}

.preview-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.json-preview-dialog__body {
  min-height: 160px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-lighter);
}

.json-preview-dialog__code {
  margin: 0;
  padding: 4px;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<style>
.json-preview-dialog.el-dialog {
  width: auto;
  max-width: min(92vw, 920px);
  margin: 0 auto;
}

.json-preview-dialog .el-dialog__body {
  padding-top: 8px;
}
</style>
