<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { PhotoStoriesContext } from '@/composables/photo-stories-key'
import type { LifePhotoItem } from '@/types/photo-story'
import {
  Delete,
  Edit,
  Plus,
  Rank,
  Refresh,
  Search,
  ZoomIn,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, inject, reactive, ref, watch } from 'vue'
import StoryImagePreview from '@/components/StoryImagePreview.vue'
import { PHOTO_STORIES_KEY } from '@/composables/photo-stories-key'
import { localPreviewUrl } from '@/composables/useLocalFiles'
import { siteConfig } from '@/site.config'
import { createEmptyPhotoStory, isStoryImagePreviewable, nextPhotoStoryId, resolveStoryImageUrl } from '@/types/photo-story'
import { cdnPreviewUrl } from '@/utils/cdn'

const props = defineProps<{
  imagePaths: string[]
}>()

const injected = inject(PHOTO_STORIES_KEY)
if (!injected)
  throw new Error('PhotoStoriesPanel 需要 PhotoStories 上下文')
const photoStories: PhotoStoriesContext = injected

const keyword = ref('')
const categoryFilter = ref('')
const sortMode = ref(false)
const drawerVisible = ref(false)
const pickerVisible = ref(false)
const pickerTargetIndex = ref<number | null>(null)
const pickerCategory = ref('')
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<LifePhotoItem>(createEmptyPhotoStory(1))
const dragStoryIndex = ref<number | null>(null)
const dropStoryIndex = ref<number | null>(null)
const dragImageIndex = ref<number | null>(null)
const dropImageIndex = ref<number | null>(null)
const previewVisible = ref(false)
const previewIndex = ref(0)

const categoryOptions = siteConfig.photoStories.categories

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

const canDragSort = computed(() =>
  !photoStories.readonly && sortMode.value && !keyword.value.trim() && !categoryFilter.value,
)

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return photoStories.items.value.filter((item) => {
    if (categoryFilter.value && item.category !== categoryFilter.value)
      return false
    if (!kw)
      return true
    return [
      item.title,
      item.description,
      item.location ?? '',
      ...(item.tags ?? []),
    ].some(text => text.toLowerCase().includes(kw))
  })
})

const groupedItems = computed(() => {
  const groups: Array<{ category: string, label: string, items: LifePhotoItem[] }> = categoryOptions.map(category => ({
    category: category.value,
    label: category.label,
    items: filteredItems.value.filter(item => item.category === category.value),
  })).filter(group => group.items.length > 0)

  const known = new Set<string>(categoryOptions.map(item => item.value))
  const others = filteredItems.value.filter(item => !known.has(item.category))
  if (others.length > 0) {
    groups.push({
      category: '__other__',
      label: '其他',
      items: others,
    })
  }
  return groups
})

const listItems = computed(() =>
  canDragSort.value ? photoStories.items.value : filteredItems.value,
)

const selectedStory = computed(() =>
  photoStories.selectedId.value === null
    ? null
    : photoStories.items.value.find(item => item.id === photoStories.selectedId.value) ?? null,
)

function openPreview(index = 0) {
  previewIndex.value = index
  previewVisible.value = true
}

watch(
  () => photoStories.items.value,
  (items) => {
    if (photoStories.selectedId.value !== null && !items.some(item => item.id === photoStories.selectedId.value))
      photoStories.selectedId.value = items[0]?.id ?? null
  },
)

watch(categoryFilter, () => {
  if (categoryFilter.value)
    sortMode.value = false
})

function storyIndex(id: number): number {
  return photoStories.items.value.findIndex(item => item.id === id)
}

function coverUrl(item: LifePhotoItem): string {
  const path = item.images[0]
  return path ? storyImageUrl(path) : ''
}

function storyImageUrl(path: string): string {
  const resolver = siteConfig.isLocalManage ? localPreviewUrl : cdnPreviewUrl
  return resolveStoryImageUrl(path, resolver)
}

function imageFolder(path: string): string {
  return path.match(/^apps\/vip-main\/([^/]+)\//)?.[1] ?? 'other'
}

const groupedPickerImages = computed(() => {
  const groups: Array<{ value: string, label: string, paths: string[] }> = categoryOptions.map(category => ({
    value: category.folder,
    label: category.label,
    paths: [] as string[],
  }))
  const otherPaths: string[] = []

  for (const path of props.imagePaths) {
    if (!isStoryImagePreviewable(path))
      continue
    const folder = imageFolder(path)
    const group = groups.find(item => item.value === folder)
    if (group)
      group.paths.push(path)
    else
      otherPaths.push(path)
  }

  if (otherPaths.length > 0) {
    groups.push({
      value: 'other',
      label: '其他目录',
      paths: otherPaths,
    })
  }

  return groups.filter(group => group.paths.length > 0)
})

const activePickerImages = computed(() => {
  if (!pickerCategory.value)
    return groupedPickerImages.value.flatMap(group => group.paths)
  const group = groupedPickerImages.value.find(item => item.value === pickerCategory.value)
  return group?.paths ?? []
})

function resetForm(item?: LifePhotoItem) {
  const source = item ?? createEmptyPhotoStory(nextPhotoStoryId(photoStories.items.value))
  Object.assign(form, {
    ...source,
    images: source.images.length > 0 ? [...source.images] : [''],
    tags: source.tags ? [...source.tags] : [],
    location: source.location ?? '',
  })
}

function openCreate() {
  editingId.value = null
  resetForm()
  drawerVisible.value = true
}

function openEdit(id: number) {
  const index = storyIndex(id)
  if (index < 0)
    return
  editingId.value = id
  resetForm(photoStories.items.value[index])
  drawerVisible.value = true
}

async function handleDelete(id: number) {
  const index = storyIndex(id)
  if (index < 0)
    return
  const row = photoStories.items.value[index]
  try {
    await ElMessageBox.confirm(`确定删除「${row.title || `故事 #${row.id}`}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    const next = photoStories.items.value.filter(item => item.id !== id)
    await photoStories.persist(next)
    ElMessage.success('已删除')
  }
  catch (error) {
    if (error !== 'cancel')
      ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

async function persistReorder(fromIndex: number, toIndex: number) {
  const next = photoStories.reorderItems(fromIndex, toIndex)
  if (next === photoStories.items.value)
    return
  try {
    await photoStories.persist(next)
    ElMessage.success('排序已保存')
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '排序保存失败')
  }
}

function onStoryDragStart(index: number, event: DragEvent) {
  if (!canDragSort.value)
    return
  dragStoryIndex.value = index
  dropStoryIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  event.dataTransfer!.effectAllowed = 'move'
  if (event.dataTransfer && event.target instanceof HTMLElement)
    event.dataTransfer.setDragImage(event.target, 20, 20)
}

function onStoryDragOver(index: number, event: DragEvent) {
  if (!canDragSort.value)
    return
  event.preventDefault()
  dropStoryIndex.value = index
  event.dataTransfer!.dropEffect = 'move'
}

function onStoryDragEnd() {
  dragStoryIndex.value = null
  dropStoryIndex.value = null
}

async function onStoryDrop(targetIndex: number) {
  if (!canDragSort.value || dragStoryIndex.value === null)
    return
  const fromIndex = dragStoryIndex.value
  dragStoryIndex.value = null
  dropStoryIndex.value = null
  await persistReorder(fromIndex, targetIndex)
}

function addImageField() {
  form.images.push('')
}

function removeImageField(index: number) {
  if (form.images.length <= 1) {
    form.images[0] = ''
    return
  }
  form.images.splice(index, 1)
}

function openImagePicker(index: number) {
  pickerTargetIndex.value = index
  pickerCategory.value = categoryOptions.find(item => item.value === form.category)?.folder ?? 'daily'
  pickerVisible.value = true
}

function selectImage(path: string) {
  if (pickerTargetIndex.value === null)
    return
  form.images[pickerTargetIndex.value] = path
  pickerVisible.value = false
  pickerTargetIndex.value = null
}

function onImageDragStart(index: number, event: DragEvent) {
  const target = event.target as HTMLElement
  if (target.closest('input, textarea, button, .el-input, .el-button, .el-image')) {
    event.preventDefault()
    return
  }
  dragImageIndex.value = index
  dropImageIndex.value = index
  event.dataTransfer?.setData('text/plain', String(index))
  event.dataTransfer!.effectAllowed = 'move'
  if (event.dataTransfer && event.currentTarget instanceof HTMLElement)
    event.dataTransfer.setDragImage(event.currentTarget, 20, 20)
}

function onImageDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  dropImageIndex.value = index
  event.dataTransfer!.dropEffect = 'move'
}

function onImageDrop(index: number) {
  if (dragImageIndex.value === null || dragImageIndex.value === index) {
    dragImageIndex.value = null
    dropImageIndex.value = null
    return
  }
  const next = [...form.images]
  const [moved] = next.splice(dragImageIndex.value, 1)
  next.splice(index, 0, moved)
  form.images.splice(0, form.images.length, ...next)
  dragImageIndex.value = null
  dropImageIndex.value = null
}

async function submitForm() {
  if (!formRef.value)
    return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid)
    return

  const story: LifePhotoItem = {
    id: form.id,
    title: form.title.trim(),
    description: form.description.trim(),
    images: form.images.map(s => s.trim()).filter(Boolean),
    category: form.category,
    date: form.date,
    location: form.location?.trim() || undefined,
    tags: form.tags?.map(t => t.trim()).filter(Boolean),
  }

  if (story.images.length === 0) {
    ElMessage.warning('至少添加一张图片')
    return
  }

  const next = [...photoStories.items.value]
  const editIndex = editingId.value === null ? -1 : storyIndex(editingId.value)
  if (editIndex < 0)
    next.push(story)
  else
    next[editIndex] = story

  try {
    await photoStories.persist(next)
    photoStories.selectedId.value = story.id
    ElMessage.success(editIndex < 0 ? '已新增' : '已保存')
    drawerVisible.value = false
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  }
}
</script>

<template>
  <ElContainer direction="vertical" class="photo-stories">
    <ElHeader height="auto" class="photo-stories__header panel-toolbar">
      <div class="panel-toolbar__row">
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索标题、描述、地点、标签"
          :prefix-icon="Search"
          class="panel-toolbar__search"
        />
        <div class="panel-toolbar__actions">
          <ElButton
            v-if="!photoStories.readonly"
            :type="sortMode ? 'primary' : 'default'"
            plain
            :icon="Rank"
            :disabled="!!keyword.trim() || !!categoryFilter"
            @click="sortMode = !sortMode"
          >
            {{ sortMode ? '完成排序' : '调整顺序' }}
          </ElButton>
          <ElButton plain :icon="Refresh" :loading="photoStories.loading.value" @click="photoStories.load()">
            刷新
          </ElButton>
          <ElButton v-if="!photoStories.readonly" type="primary" :icon="Plus" @click="openCreate">
            新增故事
          </ElButton>
        </div>
      </div>
      <div class="filter-pills panel-toolbar__filters">
        <button
          type="button"
          class="filter-pill"
          :class="{ 'is-active': categoryFilter === '' }"
          @click="categoryFilter = ''"
        >
          全部
        </button>
        <button
          v-for="item in categoryOptions"
          :key="item.value"
          type="button"
          class="filter-pill"
          :class="{ 'is-active': categoryFilter === item.value }"
          @click="categoryFilter = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="panel-toolbar__meta">
        <ElText type="info" size="small">
          {{ siteConfig.photoStories.filePath }} · 供 142vip.cn 照片墙展示
        </ElText>
        <ElText v-if="sortMode" type="warning" size="small">
          拖拽左侧卡片调整故事顺序，松手后自动保存
        </ElText>
      </div>
    </ElHeader>

    <ElAlert
      v-if="photoStories.error.value"
      type="error"
      :closable="false"
      :title="photoStories.error.value"
      show-icon
      style="margin: 0 16px 12px;"
    />

    <ElContainer v-loading="photoStories.loading.value || photoStories.saving.value" class="photo-stories__body">
      <ElAside width="320px" class="photo-stories__list">
        <ElScrollbar>
          <ElEmpty
            v-if="filteredItems.length === 0"
            :image-size="72"
            description="暂无图片故事"
          >
            <ElButton v-if="!photoStories.readonly" type="primary" :icon="Plus" @click="openCreate">
              新增故事
            </ElButton>
          </ElEmpty>

          <template v-else-if="canDragSort">
            <div class="photo-stories__list-inner">
              <article
                v-for="(item, index) in listItems"
                :key="item.id"
                class="photo-stories__card photo-stories__card--sortable"
                :class="{
                  'is-active': photoStories.selectedId.value === item.id,
                  'is-dragging': dragStoryIndex === index,
                  'is-drop-target': dropStoryIndex === index && dragStoryIndex !== index,
                }"
                draggable="true"
                @dragstart="onStoryDragStart(index, $event)"
                @dragend="onStoryDragEnd"
                @dragover="onStoryDragOver(index, $event)"
                @drop="onStoryDrop(index)"
                @click="photoStories.selectedId.value = item.id"
              >
                <div class="photo-stories__card-body">
                  <ElImage
                    v-if="coverUrl(item)"
                    :src="coverUrl(item)"
                    fit="cover"
                    class="photo-stories__cover"
                  />
                  <ElEmpty v-else :image-size="40" description="无封面" />
                  <div class="photo-stories__card-meta">
                    <div class="photo-stories__card-title">
                      <span class="photo-stories__order">{{ index + 1 }}</span>
                      <span>{{ item.title || `故事 #${item.id}` }}</span>
                    </div>
                    <div class="photo-stories__card-tags">
                      <ElTag size="small" effect="plain">
                        {{ item.category }}
                      </ElTag>
                      <ElText type="info" size="small">
                        {{ item.date }}
                      </ElText>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div
              v-for="group in groupedItems"
              :key="group.category"
              class="photo-stories__group"
            >
              <div class="photo-stories__group-title">
                {{ group.label }}
                <ElTag size="small" type="info" effect="plain">
                  {{ group.items.length }}
                </ElTag>
              </div>
              <article
                v-for="item in group.items"
                :key="item.id"
                class="photo-stories__card"
                :class="{ 'is-active': photoStories.selectedId.value === item.id }"
                @click="photoStories.selectedId.value = item.id"
              >
                <div class="photo-stories__card-body">
                  <ElImage
                    v-if="coverUrl(item)"
                    :src="coverUrl(item)"
                    fit="cover"
                    class="photo-stories__cover"
                  />
                  <ElEmpty v-else :image-size="40" description="无封面" />
                  <div class="photo-stories__card-meta">
                    <div class="photo-stories__card-title">
                      {{ item.title || `故事 #${item.id}` }}
                    </div>
                    <ElText type="info" size="small">
                      {{ item.date }} · {{ item.images.length }} 张
                    </ElText>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </ElScrollbar>
      </ElAside>

      <ElMain class="photo-stories__detail">
        <template v-if="selectedStory">
          <div
            v-if="coverUrl(selectedStory)"
            class="story-detail__hero"
            role="button"
            tabindex="0"
            title="点击查看大图"
            @click="openPreview(0)"
            @keydown.enter="openPreview(0)"
          >
            <ElImage
              :src="coverUrl(selectedStory)"
              fit="cover"
              class="story-detail__hero-img"
              loading="lazy"
            />
            <div class="story-detail__hero-mask">
              <ElText tag="h2" class="story-detail__title">
                {{ selectedStory.title }}
              </ElText>
              <ElSpace wrap :size="8">
                <ElTag effect="dark" round>
                  {{ selectedStory.category }}
                </ElTag>
                <ElTag v-if="selectedStory.location" effect="plain" round type="info">
                  {{ selectedStory.location }}
                </ElTag>
                <ElText class="story-detail__meta">
                  {{ selectedStory.date }} · {{ selectedStory.images.length }} 张
                </ElText>
              </ElSpace>
            </div>
            <span class="story-detail__hero-hint">
              <ElIcon><ZoomIn /></ElIcon>
              查看大图
            </span>
          </div>

          <div v-else class="photo-stories__detail-head">
            <div>
              <ElText tag="h2" class="photo-stories__detail-title">
                {{ selectedStory.title }}
              </ElText>
              <ElSpace wrap :size="8" style="margin-top: 8px;">
                <ElTag effect="plain">
                  {{ selectedStory.category }}
                </ElTag>
                <ElText type="info" size="small">
                  {{ selectedStory.date }}
                </ElText>
              </ElSpace>
            </div>
          </div>

          <div v-if="!photoStories.readonly" class="photo-stories__detail-actions ui-actions">
            <ElButton plain type="primary" :icon="Edit" @click="openEdit(selectedStory.id)">
              编辑
            </ElButton>
            <ElButton plain type="danger" :icon="Delete" @click="handleDelete(selectedStory.id)">
              删除
            </ElButton>
          </div>

          <ElCard shadow="never" class="story-detail__desc">
            <ElText tag="p" class="story-detail__desc-text">
              {{ selectedStory.description }}
            </ElText>
            <ElSpace v-if="selectedStory.tags?.length" wrap :size="6" style="margin-top: 12px;">
              <ElTag v-for="tag in selectedStory.tags" :key="tag" size="small" effect="plain">
                #{{ tag }}
              </ElTag>
            </ElSpace>
          </ElCard>

          <ElDivider content-position="left">
            图片集 · {{ selectedStory.images.length }} 张
          </ElDivider>
          <div class="photo-stories__gallery">
            <button
              v-for="(img, idx) in selectedStory.images"
              :key="`${selectedStory.id}-${idx}`"
              type="button"
              class="photo-stories__gallery-item"
              :class="{ 'is-featured': idx === 0 && selectedStory.images.length > 1 }"
              :title="`查看第 ${idx + 1} 张`"
              @click="openPreview(idx)"
            >
              <ElImage
                :src="storyImageUrl(img)"
                fit="cover"
                loading="lazy"
                class="photo-stories__gallery-img"
              />
              <span class="photo-stories__gallery-overlay">
                <ElIcon :size="22"><ZoomIn /></ElIcon>
              </span>
              <span class="photo-stories__gallery-badge">{{ idx + 1 }}</span>
            </button>
          </div>
        </template>
        <ElEmpty v-else description="从左侧选择故事，或新增一条" :image-size="96" />
      </ElMain>
    </ElContainer>

    <StoryImagePreview
      v-model:visible="previewVisible"
      :image-paths="selectedStory?.images ?? []"
      :initial-index="previewIndex"
      :title="selectedStory?.title"
    />

    <ElDrawer
      v-if="!photoStories.readonly"
      v-model="drawerVisible"
      :title="editingId === null ? '新增图片故事' : '编辑图片故事'"
      size="520px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" placeholder="故事标题" maxlength="80" show-word-limit />
        </ElFormItem>
        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="10"
            placeholder="故事描述"
            maxlength="500"
            show-word-limit
          />
        </ElFormItem>
        <ElRow :gutter="12">
          <ElCol :span="12">
            <ElFormItem label="分类" prop="category">
              <ElSelect v-model="form.category" placeholder="选择分类" style="width: 100%;">
                <ElOption
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="日期" prop="date">
              <ElDatePicker
                v-model="form.date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%;"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="地点">
          <ElInput v-model="form.location" placeholder="可选，如 武汉东湖" />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElSelect
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入后回车添加"
            style="width: 100%;"
          />
        </ElFormItem>
        <ElFormItem label="图片" required>
          <ElText type="info" size="small" tag="p" style="margin: 0 0 8px;">
            拖拽整行调整图片顺序（输入框内可正常编辑）；建议从对应分类目录选择图片
          </ElText>
          <div class="photo-stories__image-list">
            <div
              v-for="(imagePath, index) in form.images"
              :key="index"
              class="photo-stories__image-row"
              :class="{
                'is-drop-target': dropImageIndex === index,
                'is-dragging': dragImageIndex === index,
              }"
              draggable="true"
              @dragstart="onImageDragStart(index, $event)"
              @dragend="dragImageIndex = null; dropImageIndex = null"
              @dragover="onImageDragOver(index, $event)"
              @drop="onImageDrop(index)"
            >
              <ElInput v-model="form.images[index]" :placeholder="`apps/vip-main/${categoryOptions.find(item => item.value === form.category)?.folder ?? 'daily'}/example.webp`">
                <template #append>
                  <ElButton plain @click="openImagePicker(index)">
                    选择
                  </ElButton>
                </template>
              </ElInput>
              <ElImage
                v-if="form.images[index] && isStoryImagePreviewable(form.images[index])"
                :src="storyImageUrl(form.images[index])"
                :preview-src-list="form.images.filter(isStoryImagePreviewable).map(storyImageUrl)"
                fit="cover"
                preview-teleported
                style="width: 44px; height: 44px; border-radius: 6px; flex-shrink: 0;"
              />
              <ElButton plain type="danger" :icon="Delete" @click="removeImageField(index)" />
            </div>
            <ElButton class="photo-stories__add-image" plain type="primary" :icon="Plus" @click="addImageField">
              添加图片
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="drawerVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="photoStories.saving.value" @click="submitForm">
          保存
        </ElButton>
      </template>
    </ElDrawer>

    <ElDialog v-model="pickerVisible" title="从 vip-main 选择图片" width="760px" destroy-on-close>
      <div class="filter-pills" style="margin-bottom: 12px;">
        <button
          type="button"
          class="filter-pill"
          :class="{ 'is-active': pickerCategory === '' }"
          @click="pickerCategory = ''"
        >
          全部
        </button>
        <button
          v-for="group in groupedPickerImages"
          :key="group.value"
          type="button"
          class="filter-pill"
          :class="{ 'is-active': pickerCategory === group.value }"
          @click="pickerCategory = group.value"
        >
          {{ group.label }} ({{ group.paths.length }})
        </button>
      </div>
      <ElEmpty v-if="activePickerImages.length === 0" description="当前分类下暂无可选图片" />
      <ElScrollbar v-else max-height="420px">
        <ElRow :gutter="12">
          <ElCol v-for="path in activePickerImages" :key="path" :span="6">
            <ElCard shadow="hover" :body-style="{ padding: '8px' }" @click="selectImage(path)">
              <ElImage :src="storyImageUrl(path)" fit="cover" style="width: 100%; aspect-ratio: 1;" />
              <ElText size="small" truncated tag="p" style="margin: 6px 0 0;">
                {{ path.replace(/^apps\/vip-main\//, '') }}
              </ElText>
            </ElCard>
          </ElCol>
        </ElRow>
      </ElScrollbar>
    </ElDialog>
  </ElContainer>
</template>

<style scoped>
.photo-stories {
  height: 100%;
}

.photo-stories__header {
  height: auto;
}

.photo-stories__body {
  flex: 1;
  min-height: 0;
}

.photo-stories__list {
  border-right: 1px solid var(--el-border-color-lighter);
}

.photo-stories__list-inner,
.photo-stories__group {
  padding: 12px;
}

.photo-stories__group-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.photo-stories__card {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  cursor: pointer;
}

.photo-stories__card.is-active {
  border-color: var(--el-color-primary);
}

.photo-stories__card--sortable {
  cursor: grab;
  user-select: none;
}

.photo-stories__card--sortable:active {
  cursor: grabbing;
}

.photo-stories__card.is-dragging {
  opacity: 0.5;
}

.photo-stories__card.is-drop-target {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.photo-stories__card-body {
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
}

.photo-stories__cover {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 8px;
}

.photo-stories__card-meta {
  flex: 1;
  min-width: 0;
}

.photo-stories__card-title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-stories__card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
}

.photo-stories__order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 4px;
  border-radius: 999px;
  background: var(--el-fill-color);
  font-size: 11px;
}

.photo-stories__detail {
  padding: 16px 20px;
}

.photo-stories__detail-head {
  margin-bottom: 12px;
}

.photo-stories__detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.photo-stories__detail-actions {
  margin: 12px 0;
}

.story-detail__hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  border-radius: 12px;
  cursor: zoom-in;
}

.story-detail__hero-img {
  width: 100%;
  height: 280px;
}

.story-detail__hero-mask {
  position: absolute;
  inset: auto 0 0;
  padding: 20px 24px;
  background: linear-gradient(transparent, rgb(0 0 0 / 65%));
}

.story-detail__title {
  margin: 0 0 8px;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.story-detail__meta {
  color: rgb(255 255 255 / 85%);
  font-size: 13px;
}

.story-detail__hero-hint {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(0 0 0 / 45%);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.story-detail__hero:hover .story-detail__hero-hint {
  opacity: 1;
}

.story-detail__desc {
  margin-bottom: 8px;
  border-radius: 10px;
}

.story-detail__desc-text {
  margin: 0;
  line-height: 1.75;
  white-space: pre-wrap;
}

.photo-stories__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.photo-stories__gallery-item {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  cursor: zoom-in;
  overflow: hidden;
}

.photo-stories__gallery-item.is-featured {
  grid-column: span 2;
  grid-row: span 2;
}

.photo-stories__gallery-img,
.photo-stories__gallery-img :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
}

.photo-stories__gallery-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 30%);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-stories__gallery-item:hover .photo-stories__gallery-overlay {
  opacity: 1;
}

.photo-stories__gallery-badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(0 0 0 / 50%);
  color: #fff;
  font-size: 11px;
}

.photo-stories__image-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.photo-stories__image-row {
  display: grid;
  grid-template-columns: 1fr 44px auto;
  gap: 8px;
  align-items: center;
  padding: 4px;
  border-radius: 8px;
  cursor: grab;
}

.photo-stories__image-row.is-dragging {
  opacity: 0.5;
}

.photo-stories__image-row.is-drop-target {
  background: var(--el-color-primary-light-9);
}
</style>
