---
name: cdn-service
description: >-
  Manages the 142vip GitHub CDN image repository: apps/ layout, image rules,
  README sync, and the Vue site for local management / GitHub Pages browsing.
  Use when working on apps/ images, site/ UI, CDN config, or deployment.
---

# 142vip CDN 图床仓库

基于 GitHub 的静态资源图床，通过 Statically / jsDelivr 等 CDN 加速访问 `apps/` 下的文件。

## 仓库结构

```
cdn_service/
├── apps/                      # 图床资源（按项目目录，Agent 主要操作区）
├── site/                      # Vue 3 + Vite 管理界面（workspace 子包）
│   ├── plugins/               # apps-fs、local-apps、photos-json、manifest
│   └── src/
│       ├── site.config.ts     # ★ 统一配置
│       ├── App.vue
│       ├── components/
│       ├── composables/
│       └── utils/
├── packages/cdn/
└── package.json
```

## 双模式

| 模式 | 命令 | 行为 |
| --- | --- | --- |
| 本地管理 | `pnpm dev:site` | 读写 `apps/` |
| CDN 浏览 | `pnpm build:site` / `preview:site` | 只读 + 复制 CDN 链接 |

## UI 要点（site）

### 侧栏（下拉，持久化 `cdn-site-sidebar-view`）

| 值 | 名称 | 内容 |
| --- | --- | --- |
| `files` | 图床管理 | 目录树 + 文件列表/照片墙 + 详情 |
| `stories` | 图片故事 | `PhotoStoriesPanel` |

### 图床管理预览

共用 **`CdnPreviewBar`**：分支下拉 + CDN 下拉 + URL + 复制链接。

| 类型 | 组件 | 触发 |
| --- | --- | --- |
| 图片 | `ImagePreviewDialog` | 双击 |
| JSON | `JsonPreviewDialog` | 双击 |

`photos.json` 等 JSON 文件在目录树中可见，不再单独设 JSON 侧栏视图。

### 其他

- 左上角 Logo：展开/收起侧栏
- dev：裁剪、重命名、转 WebP、删除
- 图片故事：双击全屏预览（`StoryImagePreview`）

## 常用命令

```bash
pnpm dev:site
pnpm build:site
pnpm preview:site
pnpm lint:fix
```

## 附加资源

- [reference.md](reference.md)
- [examples.md](examples.md)
