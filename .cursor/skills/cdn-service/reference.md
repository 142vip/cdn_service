# CDN Service 参考文档

## 项目目录（apps/）

| 目录 | 用途 |
| --- | --- |
| `408` | 408CSFamily |
| `jsc` | JavaScriptCollection |
| `vip-main` | 142vip 主站（含 `photos.json` 照片墙数据） |
| `media` | 自媒体（注意历史目录 `media` 含前导空格） |
| `vip-admin` | VIP 管理端（预留） |

## npm 包 @142vip/cdn

路径：`packages/cdn/`，脚本：`scripts/sync-media.ts`

```bash
pnpm sync:cdn        # 同步 apps/media + apps/vip-main JSON → MEDIA_SRC / VIP_MAIN_SRC
pnpm build:cdn       # 构建 ESM/CJS
pnpm prepublish:cdn  # dry-run 预发布
pnpm publish:cdn     # 发布 npm
```

导出：`MEDIA_SRC`（media 图片）、`VIP_MAIN_SRC` / `VIP_MAIN_CDN`（vip-main JSON 包内路径与 CDN 链接）、`getVipMainProductionCdnUrl('photos.json')`

配置：`packages/cdn/src/config.ts`（与 site 逻辑一致，独立维护）

## 配置入口

**唯一配置文件**：`site/src/site.config.ts`

```typescript
siteConfig.cdn // defaultHost, production, development, domains
siteConfig.allowedExtensions // jpg | webp | svg
siteConfig.maxFileSize // 2MB
siteConfig.footer // 页脚、ICP、百度统计 ID
siteConfig.photoStories // photos.json 路径与分类
siteConfig.sidebarWidth // 侧栏宽度（默认 300）
```

## 图片规范

| 规则 | 要求 |
| --- | --- |
| 格式 | `.webp` / `.jpg` / `.svg` |
| 大小 | ≤ 2MB |
| 命名 | kebab-case，无中文 |
| 重命名 | 保留原扩展名，不自动转 webp |
| 裁剪另存 | 默认 webp，可选 jpg；文件名 `{base}-{宽}x{高}.ext` |

校验：`site/src/utils/validate.ts` · 服务端：`site/plugins/apps-fs.ts`

## CDN 环境

| 环境 | 分支 | 用途 |
| --- | --- | --- |
| 生产 | `main` | 线上稳定引用 |
| 开发 | `next` | 日常开发调试 |

默认域名：`cdn.statically.io` · 备选：`cdn.jsdelivr.net`、`fastly.jsdelivr.net`

## site 架构

### Vite 插件

```
plugins/apps-fs.ts      扫描树、文件 CRUD、合规校验
plugins/local-apps.ts   dev：/__local/* API + /apps/* 静态预览
plugins/photos-json.ts  photos.json 读写与校验
plugins/manifest.ts     build：写入 manifest.json（含 photoStories）
```

### Composables

| 文件 | 职责 |
| --- | --- |
| `useLocalFiles.ts` | dev 模式文件树 CRUD |
| `useManifest.ts` | 预览模式读 manifest |
| `useFileBrowser.ts` | 目录树、搜索、选中 |
| `usePhotoStories.ts` | photos.json 读写（dev）/ manifest 只读（预览） |
| `useCdnPreviewState.ts` | 预览共用：分支/host、buildAppsUrl、copyLink |
| `useAppsImageDisplay.ts` | apps 图片 CDN 展示 + dev 本地回退 |
| `useAppsJsonContent.ts` | apps JSON 拉取 + 格式化 + dev 本地回退 |

### 组件

| 组件 | 职责 |
| --- | --- |
| `CdnSourcePicker.vue` | 分支/CDN 下拉（light/dark） |
| `CdnPreviewBar.vue` | 预览工具栏：下拉 + URL + 复制 |
| `ImagePreviewDialog.vue` | 图床图片弹窗预览 |
| `JsonPreviewDialog.vue` | 图床 JSON 弹窗预览 |
| `StoryImagePreview.vue` | 图片故事全屏预览 |
| `PhotoStoriesPanel.vue` | 图片故事 CRUD |
| `CdnEnvLinks.vue` | 文件详情面板 CDN 链接 |
| `FileGallery.vue` | 图床照片墙网格 |

### 全局样式（`assets/styles/style.css`）

| 类名 | 用途 |
| --- | --- |
| `.panel-toolbar` | 图片故事工具栏 |
| `.filter-pills` / `.filter-pill` | 分类筛选、列表/照片墙切换 |
| `.sidebar-view-select` | 侧栏视图下拉 |
| `.cdn-preview-bar` | CDN 预览工具栏（light/dark 用 `.is-dark`） |

## 图片故事（photos.json）

- 数据：`apps/vip-main/photos.json`（`LifePhotoItem[]`）
- 分类：`旅游` | `运动` | `做菜` | `钓鱼` | `日常`
- 图片：`apps/vip-main/{folder}/...` 或外链 `https://...`
- 工具函数：`types/photo-story.ts` → `isRemoteStoryImage`、`isAppsImagePath`、`resolveStoryImageUrl`
- dev API：`GET/PUT /__local/photos`
- 构建：`manifest.json` 嵌入 `photoStories`

## localStorage 键

| 键 | 值 | 说明 |
| --- | --- | --- |
| `cdn-site-sidebar-visible` | `0` / `1` | 侧栏展开 |
| `cdn-site-sidebar-view` | `files` / `stories` | 侧栏视图 |
| `cdn-site-file-view` | `list` / `grid` | 图床列表/照片墙 |

## 部署

Workflow：`.github/workflows/deploy-pages.yml`

- 触发：`push` 到 `main` / `next`
- 访问：`https://142vip.github.io/cdn_service/`

## 已知遗留

- `apps/408/ukulele/` 部分中文/旧格式文件名
- `apps/media/` 目录名前导空格
- 部分 `.png`/`.jpeg` 待迁移为 webp/jpg

## Git

- 分支：`main` / `next`
- 包管理：pnpm（workspace 仅 `site/`）
- Hooks：pre-commit `lint:fix`，commit-msg `verify-commit.ts`
