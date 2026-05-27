<script setup lang="ts">
import { ArrowLeft, ArrowRight, Close, Loading } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import CdnPreviewBar from '@/components/CdnPreviewBar.vue'
import { useCdnPreviewState } from '@/composables/useCdnPreviewState'
import { localPreviewUrl } from '@/composables/useLocalFiles'
import { siteConfig } from '@/site.config'
import { isAppsImagePath, isRemoteStoryImage, resolveStoryImageUrl } from '@/types/photo-story'

const props = withDefaults(defineProps<{
  visible: boolean
  imagePaths: string[]
  initialIndex?: number
  title?: string
}>(), {
  initialIndex: 0,
  title: '',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const currentIndex = ref(0)
const loading = ref(true)
const error = ref(false)
const useLocalFallback = ref(false)

const { branch, host, resetDefaults, buildAppsUrl } = useCdnPreviewState()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const currentPath = computed(() => props.imagePaths[currentIndex.value] ?? '')
const hasMultiple = computed(() => props.imagePaths.length > 1)
const counterText = computed(() => `${currentIndex.value + 1} / ${props.imagePaths.length}`)
const isAppsPath = computed(() => isAppsImagePath(currentPath.value))

const cdnUrl = computed(() => {
  const path = currentPath.value
  if (!path)
    return ''
  if (isRemoteStoryImage(path))
    return path
  if (isAppsPath.value)
    return buildAppsUrl(path)
  return resolveStoryImageUrl(path, buildAppsUrl)
})

const localUrl = computed(() =>
  isAppsPath.value && siteConfig.isLocalManage ? localPreviewUrl(currentPath.value) : '',
)

const displaySrc = computed(() => {
  if (useLocalFallback.value && localUrl.value)
    return localUrl.value
  return cdnUrl.value
})

function close() {
  dialogVisible.value = false
}

function goPrev() {
  if (!hasMultiple.value)
    return
  currentIndex.value = (currentIndex.value - 1 + props.imagePaths.length) % props.imagePaths.length
}

function goNext() {
  if (!hasMultiple.value)
    return
  currentIndex.value = (currentIndex.value + 1) % props.imagePaths.length
}

function onKeydown(event: KeyboardEvent) {
  if (!dialogVisible.value)
    return
  if (event.key === 'Escape')
    close()
  if (event.key === 'ArrowLeft')
    goPrev()
  if (event.key === 'ArrowRight')
    goNext()
}

function resetImageState() {
  useLocalFallback.value = false
  loading.value = true
  error.value = false
}

function handleImageLoad() {
  loading.value = false
  error.value = false
}

function handleImageError() {
  if (siteConfig.isLocalManage && localUrl.value && !useLocalFallback.value) {
    useLocalFallback.value = true
    loading.value = true
    return
  }
  loading.value = false
  error.value = true
}

watch(() => props.visible, (open) => {
  if (!open)
    return
  resetDefaults()
  currentIndex.value = Math.min(
    Math.max(props.initialIndex, 0),
    Math.max(props.imagePaths.length - 1, 0),
  )
  resetImageState()
})

watch(currentPath, () => {
  resetImageState()
})

watch([branch, host], () => {
  resetImageState()
})

watch(() => props.initialIndex, (index) => {
  if (dialogVisible.value) {
    currentIndex.value = Math.min(
      Math.max(index, 0),
      Math.max(props.imagePaths.length - 1, 0),
    )
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="story-preview-fade">
      <div
        v-if="dialogVisible"
        class="story-preview"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div class="story-preview__backdrop" @click="close" />

        <header class="story-preview__header">
          <div class="story-preview__meta">
            <span v-if="title" class="story-preview__title">{{ title }}</span>
            <span v-if="hasMultiple" class="story-preview__counter">{{ counterText }}</span>
          </div>
          <button type="button" class="story-preview__close" aria-label="关闭" @click="close">
            <ElIcon><Close /></ElIcon>
          </button>
        </header>

        <div v-if="currentPath" class="story-preview__toolbar">
          <CdnPreviewBar
            v-model:branch="branch"
            v-model:host="host"
            :file-path="currentPath"
            :cdn-url="cdnUrl"
            theme="dark"
          />
        </div>

        <div class="story-preview__body">
          <button
            v-if="hasMultiple"
            type="button"
            class="story-preview__nav story-preview__nav--prev"
            aria-label="上一张"
            @click="goPrev"
          >
            <ElIcon><ArrowLeft /></ElIcon>
          </button>

          <div class="story-preview__stage">
            <div v-if="loading && !error" class="story-preview__loading">
              <ElIcon class="is-loading" :size="28">
                <Loading />
              </ElIcon>
            </div>
            <img
              v-show="!error"
              :key="displaySrc"
              :src="displaySrc"
              :alt="title ? `${title} ${counterText}` : '图片预览'"
              class="story-preview__img"
              @load="handleImageLoad"
              @error="handleImageError"
            >
            <ElEmpty v-if="error" description="图片加载失败" :image-size="72" />
          </div>

          <button
            v-if="hasMultiple"
            type="button"
            class="story-preview__nav story-preview__nav--next"
            aria-label="下一张"
            @click="goNext"
          >
            <ElIcon><ArrowRight /></ElIcon>
          </button>
        </div>

        <footer v-if="hasMultiple" class="story-preview__thumbs">
          <button
            v-for="(path, index) in imagePaths"
            :key="`${path}-${index}`"
            type="button"
            class="story-preview__thumb"
            :class="{ 'is-active': index === currentIndex }"
            @click="currentIndex = index"
          >
            <img
              :src="isAppsImagePath(path) && siteConfig.isLocalManage ? localPreviewUrl(path) : resolveStoryImageUrl(path, buildAppsUrl)"
              :alt="`缩略图 ${index + 1}`"
              loading="lazy"
            >
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.story-preview {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.story-preview__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(15 23 42 / 88%);
  backdrop-filter: blur(8px);
}

.story-preview__header,
.story-preview__toolbar,
.story-preview__body,
.story-preview__thumbs {
  position: relative;
  z-index: 1;
}

.story-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 8px;
}

.story-preview__toolbar {
  padding: 0 20px 6px;
}

.story-preview__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.story-preview__title {
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.story-preview__counter {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 12%);
  font-size: 12px;
}

.story-preview__close,
.story-preview__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgb(255 255 255 / 10%);
  color: #fff;
  cursor: pointer;
}

.story-preview__close {
  width: 36px;
  height: 36px;
}

.story-preview__close:hover,
.story-preview__nav:hover {
  background: rgb(255 255 255 / 18%);
}

.story-preview__body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 0;
  padding: 8px 12px 16px;
}

.story-preview__stage {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-height: calc(100vh - 220px);
  padding: 8px;
}

.story-preview__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  color: rgb(255 255 255 / 72%);
}

.story-preview__img {
  display: block;
  max-width: min(100%, 960px);
  max-height: calc(100vh - 240px);
  border-radius: 12px;
  box-shadow: 0 24px 64px rgb(0 0 0 / 35%);
  object-fit: contain;
}

.story-preview__nav {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}

.story-preview__thumbs {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 0 20px 18px;
  overflow-x: auto;
}

.story-preview__thumb {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  opacity: 0.72;
  overflow: hidden;
}

.story-preview__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-preview__thumb:hover,
.story-preview__thumb.is-active {
  opacity: 1;
}

.story-preview__thumb.is-active {
  border-color: rgb(255 255 255 / 88%);
}

.story-preview-fade-enter-active,
.story-preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.story-preview-fade-enter-from,
.story-preview-fade-leave-to {
  opacity: 0;
}
</style>
