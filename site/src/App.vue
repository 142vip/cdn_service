<script setup lang="ts">
import type { ElTable } from 'element-plus'
import type { FileNode } from '@/utils/validate'
import { Crop, Folder, Picture, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ImageCropDialog from '@/components/ImageCropDialog.vue'
import ImagePreviewDialog from '@/components/ImagePreviewDialog.vue'
import SidebarTree from '@/components/SidebarTree.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { useFileBrowser } from '@/composables/useFileBrowser'
import { localPreviewUrl, useLocalFiles } from '@/composables/useLocalFiles'
import { useManifest } from '@/composables/useManifest'
import { siteConfig } from '@/site.config'
import { buildCdnLinks, cdnPreviewUrl, copyText } from '@/utils/cdn'
import { isConvertibleImage, isCropableImage, isRasterImage } from '@/utils/image'
import { formatSize, formatSizeOrFileCount, getFileSuggestion, issueTagType, suggestRename } from '@/utils/validate'

const local = useLocalFiles()
const manifest = useManifest()

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
/** 默认隐藏侧栏，点击左上角按钮展开 */
const sidebarVisible = ref(localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')

watch(sidebarVisible, (visible) => {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, visible ? '1' : '0')
})

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

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

function openImagePreview(file: FileNode) {
  if (!isImage(file))
    return
  previewTarget.value = file
  previewVisible.value = true
}

function tryOpenPreviewFromRow(row: { type: string, path: string, ext?: string }) {
  if (row.type !== 'file' || !isImage(row as FileNode))
    return
  const file = findFileByPath(row.path)
  if (file)
    openImagePreview(file)
}

const cdnLinks = computed(() => {
  if (!selectedFile.value || selectedFile.value.type !== 'file')
    return []
  return buildCdnLinks(selectedFile.value.path)
})

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

async function handleCopy(url: string) {
  try {
    await copyText(url)
    ElMessage.success('链接已复制')
  }
  catch {
    ElMessage.error('复制失败')
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

onMounted(async () => {
  if (siteConfig.isLocalManage)
    await local.load()
  else
    await manifest.load()
})

watch([selectedFile, fileList], async () => {
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
            <SidebarTree
              :data="treeData"
              :current-key="treeCurrentKey"
              @node-click="handleTreeNodeClick"
            />
          </ElScrollbar>
        </ElAside>

        <ElMain class="main-panel">
          <div class="panel-title">
            {{ listTitle }}
          </div>
          <ElTable
            ref="tableRef"
            class="file-table"
            :data="fileList"
            row-key="path"
            stripe
            highlight-current-row
            @row-click="handleRowClick"
          >
            <ElTableColumn label="名称" min-width="180">
              <template #default="{ row }">
                <ElSpace>
                  <ElIcon
                    class="file-icon"
                    :class="{ 'is-clickable': row.type === 'file' && isImage(row as FileNode) }"
                    @click.stop="tryOpenPreviewFromRow(row)"
                  >
                    <component :is="row.type === 'directory' ? Folder : Picture" />
                  </ElIcon>
                  <span
                    :class="{ 'is-clickable': row.type === 'file' && isImage(row as FileNode) }"
                    @click.stop="tryOpenPreviewFromRow(row)"
                  >
                    {{ row.name }}
                  </span>
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
            <ElTableColumn label="合规" min-width="160">
              <template #default="{ row }">
                <ElTag v-if="row.issues.length === 0" type="success" size="small">
                  合规
                </ElTag>
                <ElSpace v-else wrap :size="4">
                  <ElTag v-for="issue in row.issues" :key="issue.code" :type="issueTagType(issue.code)" size="small">
                    {{ issue.message }}
                  </ElTag>
                </ElSpace>
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
        </ElMain>

        <ElAside width="320px" class="aside-panel detail-aside">
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
                title="点击查看大图"
                @click="openImagePreview(selectedFile)"
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
              <ElSpace direction="vertical" fill style="width: 100%;">
                <ElInput
                  v-for="link in cdnLinks"
                  :key="link.url"
                  :model-value="link.url"
                  readonly
                  size="small"
                >
                  <template #prepend>
                    {{ link.label }}
                  </template>
                  <template #append>
                    <ElButton @click="handleCopy(link.url)">
                      复制
                    </ElButton>
                  </template>
                </ElInput>
              </ElSpace>
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
