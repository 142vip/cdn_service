<script setup lang="ts">
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import CdnSourcePicker from '@/components/CdnSourcePicker.vue'
import { isRemoteStoryImage } from '@/types/photo-story'
import { copyText } from '@/utils/cdn'

const props = withDefaults(defineProps<{
  filePath: string
  cdnUrl: string
  theme?: 'light' | 'dark'
}>(), {
  theme: 'light',
})

const branch = defineModel<string>('branch', { required: true })
const host = defineModel<string>('host', { required: true })

const showCdnPicker = computed(() =>
  props.filePath.startsWith('apps/') && !isRemoteStoryImage(props.filePath),
)

async function handleCopy() {
  if (!props.cdnUrl)
    return
  try {
    await copyText(props.cdnUrl)
    ElMessage.success('链接已复制')
  }
  catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="cdn-preview-bar" :class="{ 'is-dark': theme === 'dark' }">
    <CdnSourcePicker
      v-if="showCdnPicker"
      v-model:branch="branch"
      v-model:host="host"
      :theme="theme"
    />
    <div v-if="cdnUrl" class="cdn-preview-bar__url-row">
      <span class="cdn-preview-bar__url" :title="cdnUrl">{{ cdnUrl }}</span>
      <ElTooltip content="复制链接" placement="top">
        <ElButton
          class="cdn-preview-bar__copy"
          :icon="CopyDocument"
          size="small"
          text
          circle
          aria-label="复制链接"
          @click="handleCopy"
        />
      </ElTooltip>
    </div>
  </div>
</template>
