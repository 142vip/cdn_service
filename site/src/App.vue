<script setup lang="ts">
import type { ElTable } from 'element-plus'
import type { FileNode, TableRow } from '@/utils/validate'
import { Crop, Folder, Grid, List, Picture, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import CdnEnvLinks from '@/components/CdnEnvLinks.vue'
import FileGallery from '@/components/FileGallery.vue'
import ImageCropDialog from '@/components/ImageCropDialog.vue'
import ImagePreviewDialog from '@/components/ImagePreviewDialog.vue'
import PhotosJsonView from '@/components/PhotosJsonView.vue'
import PhotoStoriesPanel from '@/components/PhotoStoriesPanel.vue'
import SidebarTree from '@/components/SidebarTree.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { PHOTO_STORIES_KEY } from '@/composables/photo-stories-key'
import { useFileBrowser } from '@/composables/useFileBrowser'
import { localPreviewUrl, useLocalFiles } from '@/composables/useLocalFiles'
import { useManifest } from '@/composables/useManifest'
import { usePhotoStories } from '@/composables/usePhotoStories'
import { siteConfig } from '@/site.config'
import { cdnPreviewUrl } from '@/utils/cdn'
import { isConvertibleImage, isCropableImage, isRasterImage } from '@/utils/image'
import { flattenFiles, formatSize, formatSizeOrFileCount, getFileSuggestion, suggestRename } from '@/utils/validate'

const local = useLocalFiles()
const manifest = useManifest()
const photoStories = usePhotoStories()

provide(PHOTO_STORIES_KEY, photoStories)

const tableRef = ref<InstanceType<typeof ElTable>>()
const renameVisible = ref(false)
const renameValue = ref('')
const renameTarget = ref<FileNode | null>(null)
const renameSuggestion = ref<{ suggested: string, reasons: string[] } | null>(null)
const cropVisible = ref(false)
const cropTarget = ref<FileNode | null>(null)
const previewVisible = ref(false)
const previewTarget = ref<FileNode | null>(null)

const SIDEBAR_STORAGE_KEY = 'cdn-site-sidebar-visible'
const SIDEBAR_VIEW_STORAGE_KEY = 'cdn-site-sidebar-view'
const FILE_VIEW_STORAGE_KEY = 'cdn-site-file-view'

type FileViewMode = 'list' | 'grid'
type SidebarView = 'files' | 'stories' | 'json'

function readSidebarView(): SidebarView {
  const saved = localStorage.getItem(SIDEBAR_VIEW_STORAGE_KEY)
  if (saved === 'photos-json' || saved === 'json')
    return 'json'
  if (saved === 'stories')
    return 'stories'
  return 'files'
}

/** 默认隐藏侧栏，点击左上角按钮展开 */
const sidebarVisible = ref(localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')
const sidebarView = ref<SidebarView>(readSidebarView())
const fileViewMode = ref<FileViewMode>(
  localStorage.getItem(FILE_VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list',
)

watch(sidebarVisible, (visible) => {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, visible ? '1' : '0')
})

watch(fileViewMode, (mode) => {
  localStorage.setItem(FILE_VIEW_STORAGE_KEY, mode)
})

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

const vipMainImagePaths = computed(() => {
  if (!siteConfig.isLocalManage)
    return []
  return flattenFiles(local.tree.value)
    .filter(file => file.type === 'file' && file.path.startsWith('apps/vip-main/'))
    .filter(file => file.ext && (isRasterImage(file.ext) || file.ext === 'svg'))
    .map(file => file.path)
})

const showFileBrowser = computed(() => sidebarView.value === 'files')

const isReady = computed(() =>
  siteConfig.isLocalManage
    ? local.ready.value
    : !manifest.loading.value && manifest.tree.value.length > 0,
)
const stats = computed(() => siteConfig.isLocalManage ? local.stats.value : manifest.stats.value)
const pageSubtitle = computed(() =>
  siteConfig.isLocalManage ? '本地管理 · 当前仓库 apps/' : 'CDN 浏览 · 仅查看链接',
)
const isLoading = computed(() => siteConfig.isLocalManage ? local.loading.value : manifest.loading.value)
const loadError = computed(() => siteConfig.isLocalManage ? local.error.value : manifest.error.value)

const browser = useFileBrowser(
  () => siteConfig.isLocalManage ? local.tree.value : manifest.tree.value,
  dir => siteConfig.isLocalManage ? local.getDirectoryListing(dir) : manifest.getDirectoryListing(dir),
)

const {
  selectedFile,
  globalSearch,
  treeData,
  treeCurrentKey,
  fileList,
  listTitle,
  findFileByPath,
  handleTreeNodeClick,
  handleRowClick,
} = browser

watch(sidebarView, (view) => {
  localStorage.setItem(SIDEBAR_VIEW_STORAGE_KEY, view)
  if (view === 'stories' || view === 'json')
    photoStories.load()
  if (view !== 'files')
    selectedFile.value = null
}, { immediate: true })

function openImagePreview(file: FileNode) {
  if (!isImage(file))
    return
  previewTarget.value = file
  previewVisible.value = true
}

function handleRowDblClick(row: TableRow) {
  if (row.type !== 'file')
    return
  const file = findFileByPath(row.path)
  if (file && isImage(file))
    openImagePreview(file)
}

const previewSrc = computed(() => {
  const file = selectedFile.value
  if (!file || file.type !== 'file')
    return ''
  return siteConfig.isLocalManage ? localPreviewUrl(file.path) : cdnPreviewUrl(file.path)
})

const cropImageUrl = computed(() => {
  if (!cropTarget.value)
    return ''
  return siteConfig.isLocalManage ? localPreviewUrl(cropTarget.value.path) : cdnPreviewUrl(cropTarget.value.path)
})

const cropExistingNames = computed(() => {
  if (!cropTarget.value)
    return []
  const dir = cropTarget.value.path.slice(0, cropTarget.value.path.lastIndexOf('/'))
  return local.getDirectoryListing(dir).filter(f => f.type === 'file').map(f => f.name)
})

function openRename(row: FileNode) {
  renameTarget.value = row
  renameSuggestion.value = suggestRename(row.name)
  renameValue.value = renameSuggestion.value.suggested
  renameVisible.value = true
}

async function confirmRename() {
  if (!renameTarget.value || !siteConfig.isLocalManage)
    return
  try {
    await local.renameFile(renameTarget.value.path, renameValue.value)
    ElMessage.success('重命名成功，请 git commit 提交')
    renameVisible.value = false
    if (selectedFile.value?.path === renameTarget.value.path) {
      const dir = renameTarget.value.path.slice(0, renameTarget.value.path.lastIndexOf('/'))
      selectedFile.value = findFileByPath(`${dir}/${renameValue.value}`)
    }
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '重命名失败')
  }
}

async function handleDelete(row: FileNode) {
  if (!siteConfig.isLocalManage)
    return
  try {
    await ElMessageBox.confirm(
      `确定删除 ${row.name}？文件将直接从本地删除，请 git commit 同步。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await local.deleteFile(row.path)
    ElMessage.success('删除成功')
    if (selectedFile.value?.path === row.path)
      selectedFile.value = null
  }
  catch (error) {
    if (error !== 'cancel')
      ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

function openCrop(row: FileNode) {
  cropTarget.value = row
  cropVisible.value = true
}

async function handleCropSaved(payload: {
  blob: Blob
  fileName: string
  quality: number
  overwrite: boolean
}) {
  if (!cropTarget.value)
    return
  const dir = cropTarget.value.path.slice(0, cropTarget.value.path.lastIndexOf('/'))
  try {
    const result = await local.saveNewFile(dir, payload.fileName, payload.blob)
    const action = payload.overwrite ? '已覆盖' : '已另存为'
    ElMessage.success(`${action} ${payload.fileName}（${formatSize(result.size)}，质量 ${local.formatQuality(payload.quality)}）`)
    selectedFile.value = findFileByPath(result.path)
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  }
}

async function handleConvertWebp(row: FileNode) {
  if (!siteConfig.isLocalManage)
    return
  try {
    const result = await local.convertToWebpFile(row.path)
    ElMessage.success(`已转为 WebP（${formatSize(result.size)}，质量 ${local.formatQuality(result.quality)}），请 git commit 提交`)
    selectedFile.value = findFileByPath(result.path)
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '转换失败')
  }
}

async function handleRefresh() {
  if (siteConfig.isLocalManage)
    await local.refresh()
  else
    await manifest.load()
}

function canConvertWebp(row: FileNode) {
  return row.type === 'file' && isConvertibleImage(row.ext)
}

function canCrop(row: FileNode) {
  return row.type === 'file' && isCropableImage(row.ext)
}

function isImage(row: FileNode) {
  return row.type === 'file' && (isRasterImage(row.ext) || row.ext === 'svg')
}

function filePreviewUrl(file: FileNode): string {
  return siteConfig.isLocalManage ? localPreviewUrl(file.path) : cdnPreviewUrl(file.path)
}

function handleGallerySelect(row: TableRow) {
  handleRowClick(row)
}

function handleGalleryPreview(file: FileNode) {
  if (isImage(file))
    openImagePreview(file)
}

function fileRowClassName({ row }: { row: TableRow }) {
  if (row.issues.length === 0)
    return row.type === 'file' ? 'file-row--ok' : ''
  const severe = row.issues.some(i => i.code === 'chinese' || i.code === 'size')
  return severe ? 'file-row--danger' : 'file-row--warn'
}

onMounted(async () => {
  if (siteConfig.isLocalManage)
    await local.load()
  else
    await manifest.load()
})

watch([selectedFile, fileList, fileViewMode], async () => {
  if (fileViewMode.value !== 'list')
    return
  await nextTick()
  if (!tableRef.value)
    return
  const row = selectedFile.value
    ? fileList.value.find(f => f.path === selectedFile.value?.path) ?? null
    : null
  tableRef.value.setCurrentRow(row)
})
</script>

<template>
  <ElContainer class="app-root">
    <ElHeader class="app-header">
      <ElSpace>
        <div
          class="brand-trigger"
          role="button"
          tabindex="0"
          :title="sidebarVisible ? '收起目录' : '展开目录'"
          @click="toggleSidebar"
          @keydown.enter="toggleSidebar"
        >
          <img :src="siteConfig.logo" alt="142vip CDN" class="site-logo">
          <h1>{{ siteConfig.title }}</h1>
        </div>
        <ElText type="info">
          {{ pageSubtitle }}
        </ElText>
      </ElSpace>

      <ElSpace v-if="isReady" wrap>
        <ElTag type="info">
          {{ stats.projects }} 项目
        </ElTag>
        <ElTag type="success">
          {{ stats.files }} 文件
        </ElTag>
        <ElTag v-if="stats.issues > 0" type="danger">
          {{ stats.issues }} 不合规
        </ElTag>
        <ElInput
          v-model="globalSearch"
          placeholder="搜索 apps/ 下所有文件"
          clearable
          style="width: 240px;"
          :prefix-icon="Search"
        />
        <ElButton :icon="Refresh" :loading="isLoading" @click="handleRefresh">
          刷新
        </ElButton>
      </ElSpace>
    </ElHeader>

    <ElMain class="app-content">
      <!-- 加载 / 错误 -->
      <div v-if="loadError" v-loading="isLoading && !loadError" class="app-state">
        <ElEmpty :description="loadError">
          <template v-if="siteConfig.isLocalManage">
            <ElText type="info" tag="p">
              请在仓库根目录执行 <ElText tag="code">
                pnpm dev:site
              </ElText>，并确认存在 <ElText tag="code">
                apps/
              </ElText> 目录。
            </ElText>
            <ElButton type="primary" @click="local.load()">
              重试
            </ElButton>
          </template>
        </ElEmpty>
      </div>

      <div v-else-if="isLoading && !isReady" v-loading="true" class="app-state" element-loading-text="正在加载 apps/ 目录…" />

      <!-- 主界面 -->
      <ElContainer v-else-if="isReady" class="app-body">
        <ElAside
          :width="sidebarVisible ? `${siteConfig.sidebarWidth}px` : '0px'"
          class="aside-panel sidebar-aside"
          :class="{ 'is-collapsed': !sidebarVisible }"
        >
          <ElScrollbar>
            <div class="sidebar-mode">
              <ElRadioGroup v-model="sidebarView" class="sidebar-view-switch">
                <ElRadioButton value="files">
                  图床管理
                </ElRadioButton>
                <ElRadioButton value="stories">
                  图片故事
                </ElRadioButton>
                <ElRadioButton value="json">
                  JSON文件
                </ElRadioButton>
              </ElRadioGroup>
            </div>
            <SidebarTree
              v-if="showFileBrowser"
              :data="treeData"
              :current-key="treeCurrentKey"
              @node-click="handleTreeNodeClick"
            />
          </ElScrollbar>
        </ElAside>

        <ElMain class="main-panel">
          <PhotoStoriesPanel
            v-if="sidebarView === 'stories'"
            :image-paths="vipMainImagePaths"
          />
          <PhotosJsonView v-else-if="sidebarView === 'json'" />
          <template v-else>
            <div class="panel-title panel-title--toolbar">
              <span>{{ listTitle }}</span>
              <div class="filter-pills view-switch">
                <button
                  type="button"
                  class="filter-pill"
                  :class="{ 'is-active': fileViewMode === 'list' }"
                  @click="fileViewMode = 'list'"
                >
                  <ElIcon><List /></ElIcon>
                  列表
                </button>
                <button
                  type="button"
                  class="filter-pill"
                  :class="{ 'is-active': fileViewMode === 'grid' }"
                  @click="fileViewMode = 'grid'"
                >
                  <ElIcon><Grid /></ElIcon>
                  照片墙
                </button>
              </div>
            </div>
            <ElTable
              v-if="fileViewMode === 'list'"
              ref="tableRef"
              class="file-table"
              :data="fileList"
              row-key="path"
              stripe
              highlight-current-row
              :row-class-name="fileRowClassName"
              @row-click="handleRowClick"
              @row-dblclick="handleRowDblClick"
            >
              <ElTableColumn label="名称" min-width="180">
                <template #default="{ row }">
                  <ElSpace>
                    <ElIcon class="file-icon">
                      <component :is="row.type === 'directory' ? Folder : Picture" />
                    </ElIcon>
                    <span>{{ row.name }}</span>
                  </ElSpace>
                </template>
              </ElTableColumn>
              <ElTableColumn v-if="globalSearch.trim()" label="路径" min-width="200" show-overflow-tooltip prop="path" />
              <ElTableColumn label="类型" width="72">
                <template #default="{ row }">
                  {{ row.type === 'directory' ? '目录' : row.ext?.toUpperCase() }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="大小" width="108">
                <template #default="{ row }">
                  {{ formatSizeOrFileCount(row) }}
                </template>
              </ElTableColumn>
              <ElTableColumn v-if="siteConfig.isLocalManage" label="建议" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <ElText :type="row.issues.length ? 'warning' : 'info'" size="small">
                    {{ getFileSuggestion(row) }}
                  </ElText>
                </template>
              </ElTableColumn>
            </ElTable>
            <FileGallery
              v-else
              :items="fileList"
              :selected-path="selectedFile?.path"
              :is-image="isImage"
              :preview-url="filePreviewUrl"
              @navigate="handleRowClick"
              @select="handleGallerySelect"
              @preview="handleGalleryPreview"
            />
          </template>
        </ElMain>

        <ElAside v-if="showFileBrowser" width="320px" class="aside-panel detail-aside">
          <template v-if="selectedFile">
            <div class="panel-title">
              文件详情
            </div>
            <div class="detail-panel">
              <ElDescriptions :column="1" border size="small">
                <ElDescriptionsItem label="文件名">
                  {{ selectedFile.name }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="路径">
                  {{ selectedFile.path }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="大小">
                  {{ formatSize(selectedFile.size) }}
                </ElDescriptionsItem>
              </ElDescriptions>

              <ElAlert
                v-if="selectedFile.issues.length"
                type="warning"
                :closable="false"
                show-icon
                title="建议"
                style="margin-top: 12px;"
              >
                <template #default>
                  <ElText tag="p">
                    <ElText tag="code">
                      {{ getFileSuggestion(selectedFile) }}
                    </ElText>
                  </ElText>
                  <ul style="margin: 8px 0 0; padding-left: 18px;">
                    <li v-for="issue in selectedFile.issues" :key="issue.code">
                      {{ issue.message }}
                    </li>
                  </ul>
                  <ElButton
                    v-if="siteConfig.isLocalManage"
                    size="small"
                    type="warning"
                    style="margin-top: 8px;"
                    @click="openRename(selectedFile)"
                  >
                    应用建议重命名
                  </ElButton>
                </template>
              </ElAlert>

              <div
                v-if="isImage(selectedFile)"
                class="preview-box is-clickable"
                style="margin-top: 12px;"
                title="双击查看大图"
                @dblclick="openImagePreview(selectedFile)"
              >
                <ElImage
                  :src="previewSrc"
                  :alt="selectedFile.name"
                  fit="contain"
                  style="max-height: 280px; pointer-events: none;"
                />
              </div>

              <ElSpace v-if="siteConfig.isLocalManage && selectedFile.type === 'file'" wrap style="margin-top: 12px;">
                <ElButton v-if="canCrop(selectedFile)" size="small" type="primary" :icon="Crop" @click="openCrop(selectedFile)">
                  裁剪
                </ElButton>
                <ElButton size="small" type="warning" @click="openRename(selectedFile)">
                  重命名
                </ElButton>
                <ElButton v-if="canConvertWebp(selectedFile)" size="small" type="success" @click="handleConvertWebp(selectedFile)">
                  转 WebP
                </ElButton>
                <ElButton size="small" type="danger" @click="handleDelete(selectedFile)">
                  删除
                </ElButton>
              </ElSpace>

              <ElDivider content-position="left">
                CDN 链接
              </ElDivider>
              <CdnEnvLinks v-if="selectedFile.type === 'file'" :file-path="selectedFile.path" />
              <ElText v-if="siteConfig.isLocalManage" type="info" size="small" tag="p" style="margin-top: 8px;">
                链接在 git push 后生效
              </ElText>
            </div>
          </template>
          <ElEmpty v-else description="选择文件查看预览和 CDN 链接" :image-size="80" />
        </ElAside>
      </ElContainer>
    </ElMain>

    <SiteFooter />
  </ElContainer>

  <ImagePreviewDialog
    v-model:visible="previewVisible"
    :file="previewTarget"
  />

  <ImageCropDialog
    v-model:visible="cropVisible"
    :image-url="cropImageUrl"
    :source-file="cropTarget"
    :existing-file-names="cropExistingNames"
    @saved="handleCropSaved"
  />

  <ElDialog v-model="renameVisible" title="重命名文件" width="460px">
    <ElForm @submit.prevent="confirmRename">
      <ElFormItem label="新文件名">
        <ElInput v-model="renameValue" placeholder="kebab-case.webp 或 icon.svg" autofocus />
      </ElFormItem>
      <ElAlert
        v-if="renameSuggestion"
        type="info"
        :closable="false"
        title="建议"
        style="margin-bottom: 12px;"
      >
        <template #default>
          <ElText tag="code">
            {{ renameSuggestion.suggested }}
          </ElText>
          <ul style="margin: 8px 0; padding-left: 18px;">
            <li v-for="r in renameSuggestion.reasons" :key="r">
              {{ r }}
            </li>
          </ul>
          <ElButton size="small" link type="primary" @click="renameValue = renameSuggestion!.suggested">
            使用建议名称
          </ElButton>
        </template>
      </ElAlert>
      <ElText type="info" size="small">
        规范：kebab-case · .jpg / .webp / .svg · 无中文 · ≤ 2MB
      </ElText>
    </ElForm>
    <template #footer>
      <ElButton @click="renameVisible = false">
        取消
      </ElButton>
      <ElButton type="primary" @click="confirmRename">
        确认
      </ElButton>
    </template>
  </ElDialog>
</template>
