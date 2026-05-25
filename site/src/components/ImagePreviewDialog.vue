<script setup lang="ts">
import type { FileNode } from '@/utils/validate'
import { CopyDocument, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { localPreviewUrl } from '@/composables/useLocalFiles'
import { siteConfig } from '@/site.config'
import { cdnPreviewUrl, copyText } from '@/utils/cdn'

const props = defineProps<{
  visible: boolean
  file: FileNode | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const previewBranch = ref(siteConfig.cdn.previewBranch)
const previewHost = ref(siteConfig.cdn.previewHost)
const imageLoaded = ref(false)
const imageError = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const previewUrl = computed(() => {
  if (!props.file || props.file.type !== 'file')
    return ''
  if (siteConfig.isLocalManage)
    return localPreviewUrl(props.file.path)
  return cdnPreviewUrl(props.file.path, previewBranch.value, previewHost.value)
})

const copyLink = computed(() => {
  if (!previewUrl.value)
    return ''
  if (previewUrl.value.startsWith('http'))
    return previewUrl.value
  return `${window.location.origin}${previewUrl.value}`
})

async function handleCopyLink() {
  if (!copyLink.value)
    return
  try {
    await copyText(copyLink.value)
    ElMessage.success('链接已复制')
  }
  catch {
    ElMessage.error('复制失败')
  }
}

watch(() => props.visible, (open) => {
  if (open) {
    previewBranch.value = siteConfig.cdn.previewBranch
    previewHost.value = siteConfig.cdn.previewHost
    imageLoaded.value = false
    imageError.value = false
  }
})

watch(previewUrl, () => {
  imageLoaded.value = false
  imageError.value = false
})
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
      <div class="preview-header">
        <span class="preview-title">{{ file?.name ?? '图片预览' }}</span>
        <ElButton
          v-if="copyLink"
          size="small"
          :icon="CopyDocument"
          @click="handleCopyLink"
        >
          复制链接
        </ElButton>
      </div>
    </template>

    <ElSpace v-if="!siteConfig.isLocalManage" wrap class="preview-toolbar">
      <ElText type="info">
        CDN
      </ElText>
      <ElSelect v-model="previewHost" size="small" style="width: 160px;">
        <ElOption
          v-for="domain in siteConfig.cdn.domains"
          :key="domain.host"
          :label="domain.label"
          :value="domain.host"
        />
      </ElSelect>
      <ElText type="info">
        分支
      </ElText>
      <ElRadioGroup v-model="previewBranch" size="small">
        <ElRadioButton v-for="branch in siteConfig.cdn.branches" :key="branch" :value="branch">
          {{ branch }}
        </ElRadioButton>
      </ElRadioGroup>
    </ElSpace>

    <div class="preview-stage">
      <div v-if="!imageLoaded && !imageError && previewUrl" class="preview-loading">
        <ElIcon class="is-loading">
          <Loading />
        </ElIcon>
      </div>
      <img
        v-show="imageLoaded && !imageError"
        :src="previewUrl"
        :alt="file?.name"
        class="preview-img"
        @load="imageLoaded = true"
        @error="imageError = true"
      >
      <ElEmpty v-if="imageError" description="图片加载失败，请检查 CDN 链接或分支" />
    </div>

    <ElText
      v-if="!siteConfig.isLocalManage && previewUrl"
      type="info"
      size="small"
      tag="p"
      class="preview-url"
    >
      {{ previewUrl }}
    </ElText>
  </ElDialog>
</template>

<style scoped>
.preview-header {
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

.preview-toolbar {
  margin-bottom: 12px;
}

.preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 120px;
  max-height: min(72vh, 820px);
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
  image-rendering: auto;
}

.preview-url {
  margin: 12px 0 0;
  word-break: break-all;
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
