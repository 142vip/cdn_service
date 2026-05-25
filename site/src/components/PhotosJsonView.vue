<script setup lang="ts">
import type { PhotoStoriesContext } from '@/composables/photo-stories-key'
import { CopyDocument, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, inject } from 'vue'
import { PHOTO_STORIES_KEY } from '@/composables/photo-stories-key'
import { siteConfig } from '@/site.config'

const injected = inject(PHOTO_STORIES_KEY)
if (!injected)
  throw new Error('PhotosJsonView 需要 PhotoStories 上下文')
const photoStories: PhotoStoriesContext = injected

const jsonText = computed(() => photoStories.jsonPreview())

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
    ElMessage.success('已复制 JSON')
  }
  catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="photos-json-view">
    <div class="photos-json-view__head">
      <div>
        <ElText tag="h2" class="photos-json-view__title">
          photos.json
        </ElText>
        <ElText type="info" size="small">
          {{ siteConfig.photoStories.filePath }} · 当前 {{ photoStories.items.value.length }} 条故事
        </ElText>
      </div>
      <ElSpace>
        <ElButton :icon="Refresh" :loading="photoStories.loading.value" @click="photoStories.load()">
          刷新
        </ElButton>
        <ElButton type="primary" :icon="CopyDocument" @click="copyJson">
          复制 JSON
        </ElButton>
      </ElSpace>
    </div>

    <ElAlert
      v-if="photoStories.error.value"
      type="error"
      :closable="false"
      :title="photoStories.error.value"
      show-icon
      style="margin-bottom: 12px;"
    />

    <ElCard v-loading="photoStories.loading.value" shadow="never" class="photos-json-view__card">
      <ElScrollbar max-height="calc(100vh - 220px)">
        <pre class="photos-json-view__code">{{ jsonText }}</pre>
      </ElScrollbar>
    </ElCard>
  </div>
</template>

<style scoped>
.photos-json-view {
  height: 100%;
  padding: 20px 24px;
}

.photos-json-view__head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.photos-json-view__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.photos-json-view__card {
  border-radius: 12px;
}

.photos-json-view__code {
  margin: 0;
  padding: 4px 8px 12px;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
