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
│   ├── plugins/
│   │   ├── apps-fs.ts         # Node：扫描/读写 apps/
│   │   ├── local-apps.ts      # dev 中间件 + 本地 API
│   │   ├── photos-json.ts     # photos.json 读写校验
│   │   └── manifest.ts        # 构建 manifest.json
│   └── src/
│       ├── site.config.ts     # ★ 统一配置（CDN、规范、页脚）
│       ├── App.vue
│       ├── assets/styles/style.css  # 全局 UI（panel-toolbar、cdn-preview-bar 等）
│       ├── components/
│       ├── composables/
│       ├── types/
│       └── utils/
├── packages/cdn/              # @142vip/cdn npm 包
├── scripts/core/verify-commit.ts
├── pnpm-workspace.yaml        # packages: [site]，排除 apps/
└── package.json               # dev:site / build:site / preview:site
```

## 双模式

| 模式 | 命令 | 行为 |
| --- | --- | --- |
| 本地管理 | `pnpm dev:site` | `siteConfig.isLocalManage`，Vite 中间件读写 `apps/` |
| CDN 浏览 | `pnpm build:site` / `preview:site` | 读 `manifest.json`，只读 + 复制 CDN 链接 |

本地改动需自行 `git commit && git push` 后 CDN 才生效。

## 核心规范

1. **apps 按项目存图，图片变更须更新对应 README.md**
2. **位图 `.webp` / `.jpg`，图标 `.svg`，≤ 2MB**
3. **kebab-case 命名，禁止中文**
4. **重命名不改扩展名**；格式转换用「转 WebP」；裁剪另存为可选 webp/jpg

## CDN

```
https://{host}/gh/142vip/cdn_service@{branch}/apps/{path}
```

配置：`site/src/site.config.ts` → `siteConfig.cdn`（defaultHost、production、development、domains）

## 图片工作流

```
- [ ] 确认 apps/{项目}/ 目录
- [ ] 校验命名、格式、大小
- [ ] 放置/更新文件
- [ ] 更新 README.md
- [ ] pnpm dev:site 本地确认
- [ ] commit（scope: 408 | jsc | vip-main |media | vip-admin | site | scripts）
```

## 常用命令

```bash
pnpm i
pnpm dev:site
pnpm build:site
pnpm preview:site
pnpm sync:cdn
pnpm build:cdn
pnpm lint:fix
```

## UI 要点（site）

### 侧栏三视图（等宽 Tab，持久化 `cdn-site-sidebar-view`）

| 值 | 名称 | 内容 |
| --- | --- | --- |
| `files` | 图床管理 | 目录树 + 列表/照片墙 + 文件详情 |
| `stories` | 图片故事 | `PhotoStoriesPanel` 照片墙 CRUD |
| `json` | JSON文件 | `PhotosJsonView` 只读/复制 photos.json |

旧值 `photos-json` 自动迁移为 `json`。

### 图片预览（dev / 预览 UI 一致）

共用 **`CdnPreviewBar`**：分支切换 + CDN 域名 + URL 展示 + 圆形复制图标。

| 场景 | 组件 | 触发 |
| --- | --- | --- |
| 图床管理 | `ImagePreviewDialog`（弹窗） | 双击文件/图片 |
| 图片故事 | `StoryImagePreview`（全屏） | 双击图片集 |

- `apps/` 路径：可选分支/CDN，复制 CDN 链接；dev 下 CDN 加载失败自动回退本地 `/apps/...`
- 外链 `https://...`：仅显示 URL + 复制，无 CDN 选择器

### 其他

- 点击左上角 Logo/标题：展开/收起侧栏（默认隐藏，`cdn-site-sidebar-visible`）
- 图床管理右侧详情：`CdnEnvLinks` 生产/开发环境链接（仅 files 视图）
- dev 专属：裁剪、重命名、转 WebP、删除

## 附加资源

- [reference.md](reference.md) — 架构细节、组件与 composable 说明
- [examples.md](examples.md) — 操作示例
