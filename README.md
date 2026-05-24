# @142vip/cdn-service

142vip 平台 GitHub 图床仓库：静态资源托管于 `apps/`，通过 jsDelivr 等 CDN 加速，并提供 Vue 管理界面。

## 项目结构

```
cdn_service/
├── apps/                    # 图床资源（按项目分目录，主要工作区）
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
├── scripts/core/            # git hooks（commit-msg 校验）
├── pnpm-workspace.yaml      # workspace 仅含 site，排除 apps/
└── package.json             # 根脚本与工具链
```

## 安装

```shell
pnpm i
```

## 图床管理界面

```shell
pnpm site:dev       # 本地管理 apps/（裁剪、重命名、删除、转 WebP）
pnpm site:build     # 构建静态站点（GitHub Pages）
pnpm site:preview   # 预览构建产物
```

| 模式 | 命令 | 说明 |
| --- | --- | --- |
| 本地管理 | `pnpm site:dev` | 读写当前仓库 `apps/`，改完后 git 提交 |
| CDN 浏览 | `pnpm site:build` + Pages | 只读浏览、复制 CDN 链接 |

**GitHub Pages**

- `main` → https://142vip.github.io/cdn_service/
- `next` → https://142vip.github.io/cdn_service/next/

## CDN 访问格式

```
https://{CDN域名}/gh/142vip/cdn_service@{分支}/apps/{项目}/{路径}/{文件名}
```

示例：

```
https://cdn.jsdelivr.net/gh/142vip/cdn_service@main/apps/main-vip/svg/github.svg
```

CDN 域名与分支可在 `site/src/site.config.ts` 的 `cdn` 字段配置。

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

## 参考

- Skill 文档：`.cursor/skills/cdn-service/`

## 证书

MIT © 2019-present 142vip 储凡
