<script setup lang="ts">
import type { FileNode } from '@/utils/validate'
import { CopyDocument } from '@element-plus/icons-vue'
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

/** 可复制链接：本地模式补全 origin，线上为 CDN 绝对地址 */
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
  }
})
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    width="80%"
    top="5vh"
    destroy-on-close
    append-to-body
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
    <ElSpace v-if="!siteConfig.isLocalManage" wrap style="margin-bottom: 12px;">
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
      <ElImage
        v-if="previewUrl"
        :src="previewUrl"
        :alt="file?.name"
        fit="contain"
        style="width: 100%; max-height: 70vh;"
      >
        <template #error>
          <ElEmpty description="图片加载失败，请检查 CDN 链接或分支" />
        </template>
      </ElImage>
    </div>

    <ElText v-if="!siteConfig.isLocalManage" type="info" size="small" tag="p" style="margin-top: 12px; word-break: break-all;">
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
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-stage {
  display: flex;
  justify-content: center;
  min-height: 200px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
}
</style>
