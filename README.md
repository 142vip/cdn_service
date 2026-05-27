# @142vip/cdn-service

142vip 平台 GitHub 图床仓库：静态资源托管于 `apps/`，通过 Statically 等 CDN 加速，并提供 Vue 管理界面。

## 项目结构

```
cdn_service/
├── apps/                    # 图床资源（按项目分目录，主要工作区）
├── packages/cdn/            # @142vip/cdn npm 包（media 资源 + CDN 工具）
├── site/                    # 图床管理界面（pnpm workspace 子包）
│   ├── plugins/             # Vite 插件：apps-fs、local-apps、manifest
│   ├── src/
│   │   ├── site.config.ts   # 统一配置（CDN 域名、规范、页脚等）
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── assets/          # logo、样式、构建生成的 manifest.json
│   │   ├── components/
│   │   ├── composables/
│   │   ├── types/           # env.d.ts、自动生成的组件类型
│   │   └── utils/
│   ├── vite.config.ts
│   └── package.json         # 仅声明依赖，脚本在根目录
├── scripts/
│   ├── sync-media.ts        # 同步media、生成 MEDIA_SRC
│   └── core/verify-commit.ts
├── pnpm-workspace.yaml      # workspace 仅含 site，排除 apps/
└── package.json             # 根脚本与工具链
```

## 安装

```shell
pnpm i
```

## 图床管理界面

```shell
pnpm dev:site       # 本地管理 apps/（裁剪、重命名、删除、转 WebP）
pnpm build:site     # 构建静态站点（GitHub Pages）
pnpm build:cdn      # 构建 @142vip/cdn npm 包
pnpm preview:site   # 预览构建产物
```

| 模式 | 命令 | 说明 |
| --- | --- | --- |
| 本地管理 | `pnpm dev:site` | 读写当前仓库 `apps/`，改完后 git 提交 |
| CDN 浏览 | `pnpm build:site` + Pages | 只读浏览、复制 CDN 链接 |

**侧栏视图**（下拉选择，持久化到 `localStorage`）

| 视图 | 说明 |
| --- | --- |
| **图床管理** | 浏览 `apps/` 文件树；支持图片与 JSON 预览；dev 下可裁剪、重命名、删除 |
| **图片故事** | 管理 `apps/vip-main/photos.json` 照片墙（dev 可编辑，预览只读） |

**文件预览**（dev 与预览 UI 一致）

- 图片：双击 → 弹窗，可切换分支/CDN、复制链接
- JSON（如 `photos.json`）：双击 → JSON 预览弹窗，同样支持分支/CDN/复制链接与复制内容

**GitHub Pages**

- 访问地址：https://142vip.github.io/cdn_service/
- `main` / `next` 推送均会触发部署，但 Pages 地址相同（以最近一次部署为准）

## CDN 访问格式

```
https://{CDN域名}/gh/142vip/cdn_service@{分支}/apps/{项目}/{路径}/{文件名}
```

示例：

```
https://cdn.statically.io/gh/142vip/cdn_service@main/apps/vip-main/daily/example.webp
```

| 环境 | 分支 | 用途 |
| --- | --- | --- |
| 生产 | `main` | 线上稳定引用 |
| 开发 | `next` | 日常开发调试 |

默认 CDN 域名：`cdn.statically.io`。可在 `site/src/site.config.ts` 或 `packages/cdn/src/config.ts` 调整。

## @142vip/cdn

供其他项目使用的 npm 包。**前端优先 `import` 包内资源；外链场景用 `getProductionCdnUrl`。**

```bash
pnpm sync:cdn · build:cdn · prepublish:cdn · publish:cdn
```

```ts
import { getProductionCdnUrl } from '@142vip/cdn'
import wechatCode from '@142vip/cdn/media/wechat/chu-fan-code.jpg'
```

详见 [packages/cdn/README.md](packages/cdn/README.md)。

## 图片规范

| 规则 | 要求 |
| --- | --- |
| 格式 | 位图 `.webp`（推荐）或 `.jpg`；图标 `.svg` |
| 大小 | ≤ 2MB |
| 命名 | kebab-case，禁止中文 |
| README | 图片变更需同步更新对应目录 README |

## 其他命令

```shell
pnpm lint:fix       # ESLint
pnpm release        # 版本发布
```

## 证书

[MIT](https://opensource.org/license/MIT)

Copyright (c) 2019-present, 142vip 储凡
