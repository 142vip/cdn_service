<script setup lang="ts">
import type { ImageOutputFormat } from '@/utils/convert'
import type { CropNameSuggestion } from '@/utils/crop-name'
import type { CropRatioPreset } from '@/utils/image'
import type { FileNode } from '@/utils/validate'
import Cropper from 'cropperjs'
import { ElMessage } from 'element-plus'
import { computed, nextTick, ref, watch } from 'vue'
import { compressCanvas, formatQuality } from '@/utils/convert'
import {
  buildCropNameSuggestions,
  resolveCropFileName,
} from '@/utils/crop-name'
import { CROP_RATIO_PRESETS } from '@/utils/image'
import { formatSize } from '@/utils/validate'
import 'cropperjs/dist/cropper.css'

const props = defineProps<{
  visible: boolean
  imageUrl: string
  sourceFile: FileNode | null
  /** 同目录下已有文件名，用于标记覆盖 */
  existingFileNames?: string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': [payload: { blob: Blob, fileName: string, quality: number, size: number, overwrite: boolean }]
}>()

const imgRef = ref<HTMLImageElement>()
const cropper = ref<Cropper>()
const activeRatio = ref(Number.NaN)
const activeRatioLabel = ref('自由')
const outputFormat = ref<ImageOutputFormat>('webp')
const cropSize = ref({ width: 0, height: 0 })
const nameSuggestions = ref<CropNameSuggestion[]>([])
const selectedNameKey = ref('')
const customFileName = ref('')
const qualityHint = ref('')
const saving = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const sourceDir = computed(() => {
  if (!props.sourceFile)
    return 'apps'
  return props.sourceFile.path.slice(0, props.sourceFile.path.lastIndexOf('/'))
})

const activeSuggestion = computed(() =>
  nameSuggestions.value.find(item => item.fileName === selectedNameKey.value),
)

const willOverwrite = computed(() => {
  if (selectedNameKey.value === '__custom__')
    return props.existingFileNames?.includes(customFileName.value.trim()) ?? false
  return activeSuggestion.value?.overwrite ?? false
})

function destroyCropper() {
  cropper.value?.destroy()
  cropper.value = undefined
}

function readCropSize(): { width: number, height: number } {
  const data = cropper.value?.getData()
  if (!data)
    return { width: 0, height: 0 }
  return {
    width: Math.max(1, Math.round(data.width)),
    height: Math.max(1, Math.round(data.height)),
  }
}

function refreshNameSuggestions() {
  if (!props.sourceFile)
    return

  cropSize.value = readCropSize()
  const suggestions = buildCropNameSuggestions({
    sourceFileName: props.sourceFile.name,
    format: outputFormat.value,
    width: cropSize.value.width,
    height: cropSize.value.height,
    existingFileNames: props.existingFileNames,
  })

  nameSuggestions.value = suggestions
  if (!suggestions.some(item => item.fileName === selectedNameKey.value))
    selectedNameKey.value = suggestions[0]?.fileName ?? ''
}

async function initCropper() {
  destroyCropper()
  await nextTick()
  if (!imgRef.value)
    return

  cropper.value = new Cropper(imgRef.value, {
    viewMode: 1,
    dragMode: 'move',
    aspectRatio: Number.NaN,
    autoCropArea: 0.9,
    responsive: true,
    restore: false,
    guides: true,
    center: true,
    highlight: true,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    crop: () => refreshNameSuggestions(),
  })
  refreshNameSuggestions()
}

function setAspectRatio(preset: CropRatioPreset) {
  activeRatio.value = preset.value
  activeRatioLabel.value = preset.label
  cropper.value?.setAspectRatio(preset.value)
  refreshNameSuggestions()
}

watch(() => props.visible, async (open) => {
  if (open && props.sourceFile) {
    outputFormat.value = 'webp'
    activeRatio.value = Number.NaN
    activeRatioLabel.value = '自由'
    selectedNameKey.value = ''
    customFileName.value = ''
    qualityHint.value = ''
    await nextTick()
    if (imgRef.value?.complete)
      await initCropper()
  }
  else {
    destroyCropper()
  }
})

watch(outputFormat, () => refreshNameSuggestions())

watch(() => props.existingFileNames, () => refreshNameSuggestions())

async function onImageLoad() {
  if (props.visible)
    await initCropper()
}

function resolveOutputFileName(): string {
  return resolveCropFileName(selectedNameKey.value, customFileName.value, nameSuggestions.value)
}

async function handleSave() {
  if (!cropper.value || !props.sourceFile)
    return

  const previewName = resolveOutputFileName()
  if (!previewName && selectedNameKey.value === '__custom__')
    return ElMessage.warning('请输入自定义文件名')

  saving.value = true
  qualityHint.value = ''
  try {
    const canvas = cropper.value.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    if (!canvas.width || !canvas.height)
      throw new Error('裁剪区域无效')

    cropSize.value = { width: canvas.width, height: canvas.height }
    const finalSuggestions = buildCropNameSuggestions({
      sourceFileName: props.sourceFile.name,
      format: outputFormat.value,
      width: canvas.width,
      height: canvas.height,
      existingFileNames: props.existingFileNames,
    })
    const finalName = resolveCropFileName(
      selectedNameKey.value,
      customFileName.value,
      finalSuggestions,
    )
    if (!finalName)
      throw new Error('请选择或输入文件名')

    const { blob, quality } = await compressCanvas(canvas, { format: outputFormat.value })
    qualityHint.value = `压缩质量 ${formatQuality(quality)}，输出 ${formatSize(blob.size)}`

    const overwrite = props.existingFileNames?.includes(finalName) ?? false
    emit('saved', {
      blob,
      fileName: finalName,
      quality,
      size: blob.size,
      overwrite,
    })
    dialogVisible.value = false
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '裁剪保存失败')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="裁剪图片"
    width="860px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div v-if="sourceFile" class="crop-dialog">
      <p class="crop-source">
        源文件：<code>{{ sourceFile.path }}</code>
      </p>

      <div class="ratio-bar">
        <span class="ratio-label">裁剪比例</span>
        <ElButton
          v-for="preset in CROP_RATIO_PRESETS"
          :key="preset.label"
          size="small"
          :type="activeRatioLabel === preset.label ? 'primary' : 'default'"
          @click="setAspectRatio(preset)"
        >
          {{ preset.label }}
        </ElButton>
      </div>

      <div class="crop-stage">
        <img
          ref="imgRef"
          :src="imageUrl"
          alt="crop source"
          class="crop-image"
          @load="onImageLoad"
        >
      </div>

      <div class="crop-options">
        <ElForm label-width="88px" @submit.prevent="handleSave">
          <ElFormItem label="另存为">
            <ElRadioGroup v-model="selectedNameKey" class="name-suggestions">
              <div
                v-for="item in nameSuggestions"
                :key="item.fileName"
                class="name-option"
              >
                <ElRadio :value="item.fileName">
                  <code class="name-code">{{ item.fileName }}</code>
                  <span class="name-label">{{ item.label }}</span>
                  <ElTag v-if="item.overwrite" size="small" type="warning">
                    覆盖
                  </ElTag>
                </ElRadio>
              </div>
              <div class="name-option">
                <ElRadio value="__custom__">
                  自定义文件名
                </ElRadio>
              </div>
            </ElRadioGroup>
            <ElInput
              v-if="selectedNameKey === '__custom__'"
              v-model="customFileName"
              class="custom-name-input"
              placeholder="logo-800x600.webp"
            />
          </ElFormItem>
          <ElFormItem label="输出格式">
            <ElRadioGroup v-model="outputFormat">
              <ElRadio value="webp">
                WebP（推荐，体积小）
              </ElRadio>
              <ElRadio value="jpeg">
                JPG
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="保存目录">
            <ElInput :model-value="sourceDir" readonly />
          </ElFormItem>
        </ElForm>
        <ElText type="info" size="small" tag="p">
          另存为默认 WebP；可选 JPG。文件名仅含基础名与输出尺寸，不含 crop 等无关词。
        </ElText>
        <p v-if="willOverwrite" class="overwrite-hint">
          <ElAlert type="warning" :closable="false" title="将覆盖目录中已存在的同名文件。" />
        </p>
        <p v-if="qualityHint">
          <ElAlert type="success" :closable="false" :title="qualityHint" />
        </p>
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">
        取消
      </ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSave">
        {{ willOverwrite ? '覆盖保存' : '另存为' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.crop-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crop-source {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ratio-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.ratio-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}

.crop-stage {
  width: 100%;
  height: 420px;
  background: var(--el-fill-color-darker);
  overflow: hidden;
}

.crop-image {
  display: block;
  max-width: 100%;
}

.crop-options {
  margin-top: 4px;
}

.name-suggestions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.name-option {
  width: 100%;
}

.name-option :deep(.el-radio) {
  height: auto;
  align-items: flex-start;
  white-space: normal;
}

.name-code {
  margin-right: 8px;
  font-size: 12px;
}

.name-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 6px;
}

.custom-name-input {
  margin-top: 8px;
}

.overwrite-hint,
.quality-hint {
  margin: 8px 0 0;
}

.overwrite-hint :deep(.el-alert),
.quality-hint :deep(.el-alert) {
  padding: 8px 12px;
}
</style>
