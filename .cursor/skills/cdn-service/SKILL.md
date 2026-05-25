---
name: cdn-service
description: >-
  Manages the 142vip GitHub CDN image repository: apps/ layout, image rules,
  README sync, and the Vue site for local management / GitHub Pages browsing.
  Use when working on apps/ images, site/ UI, CDN config, or deployment.
---

# 142vip CDN 图床仓库

基于 GitHub 的静态资源图床，通过 jsDelivr 等 CDN 加速访问 `apps/` 下的文件。

## 仓库结构

```
cdn_service/
├── apps/                      # 图床资源（按项目目录，Agent 主要操作区）
├── site/                      # Vue 3 + Vite 管理界面（workspace 子包）
│   ├── plugins/
│   │   ├── apps-fs.ts         # Node：扫描/读写 apps/
│   │   ├── local-apps.ts      # dev 中间件 + 本地 API
│   │   └── manifest.ts        # 构建 manifest.json
│   └── src/
│       ├── site.config.ts     # ★ 统一配置（CDN、规范、页脚）
│       ├── main.ts
│       ├── App.vue
│       ├── assets/
│       ├── components/
│       ├── composables/
│       ├── types/
│       └── utils/
├── scripts/core/verify-commit.ts
├── pnpm-workspace.yaml        # packages: [site]，排除 apps/
└── package.json               # dev:site / build:site / preview:site
```

## 双模式

| 模式 | 命令 | 行为 |
| --- | --- | --- |
| 本地管理 | `pnpm dev:site` | `siteConfig.isLocalManage`，Vite 中间件读写 `apps/` |
| CDN 浏览 | `pnpm build:site` | 读 `manifest.json`，只读 + 复制链接 |

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
- [ ] commit（scope: 408 | jsc | vip-main | media | vip-admin | site | scripts）
```

## 常用命令

```bash
pnpm i
pnpm dev:site
pnpm build:site
pnpm preview:site
pnpm sync:cdn
pnpm build:cdn
pnpm prepublish:cdn
pnpm publish:cdn
pnpm lint:fix
```

## UI 要点（site）

- 点击左上角 Logo/标题：展开/收起左侧目录树（默认隐藏）
- 侧栏下拉：**图床目录** / **照片故事**（选择持久化 `localStorage`）
- 照片故事子菜单：**照片墙**（CRUD，dev 可编辑）/ **photos.json**（JSON 预览）
- 点击文件名/预览图：弹窗预览，右上角可复制链接
- 右侧详情：CDN 链接、裁剪/重命名/转 WebP/删除（仅 dev）

## 附加资源

- [reference.md](reference.md) — 规范细节、README 模板
