# CDN Service 参考文档

## 项目目录（apps/）

| 目录 | 用途 |
| --- | --- |
| `408` | 408CSFamily |
| `jsc` | JavaScriptCollection |
| `main-vip` | 142vip 主站 |
| `media` | 自媒体（注意历史目录 ` media` 含前导空格） |
| `vip-amin` | VIP 管理端（预留） |

## 配置入口

**唯一配置文件**：`site/src/site.config.ts`

```typescript
siteConfig.cdn // repoOwner, repoName, domains, branches, previewHost
siteConfig.allowedExtensions // jpg | webp | svg
siteConfig.maxFileSize // 2MB
siteConfig.footer // 页脚、ICP、百度统计 ID
```

修改 CDN 域名或分支后重新 `pnpm site:build` 部署。

## 图片规范

| 规则 | 要求 |
| --- | --- |
| 格式 | `.webp` / `.jpg` / `.svg` |
| 大小 | ≤ 2MB |
| 命名 | kebab-case，无中文 |
| 重命名 | 保留原扩展名，不自动转 webp |
| 裁剪另存 | 默认 webp，可选 jpg；文件名 `{base}-{宽}x{高}.ext`，不含 crop/free |

校验逻辑：`site/src/utils/validate.ts`
服务端校验：`site/plugins/apps-fs.ts`

## CDN 域名（默认）

| 域名 | 说明 |
| --- | --- |
| `cdn.jsdelivr.net` | 默认预览 |
| `cdn.statically.io` | 备选 |
| `fastly.jsdelivr.net` | 备选 |

分支：`main`（生产）、`next`（预发）

## site 架构

```
plugins/apps-fs.ts      扫描树、文件 CRUD、合规校验
plugins/local-apps.ts   dev：/__local/* API + /apps/* 静态预览
plugins/manifest.ts     build：写入 src/assets/manifest.json → dist/

composables/
  useLocalFiles.ts      dev 模式 API 客户端
  useManifest.ts        Pages 模式读 manifest
  useFileBrowser.ts     目录树、搜索、选中

utils/
  validate.ts           前端校验与命名建议
  cdn.ts                CDN URL 生成
  crop-name.ts          裁剪文件名建议
  convert.ts            压缩、webp 转换
```

## 部署

Workflow：`.github/workflows/deploy-pages.yml`

- 触发：`push` 到 `main` / `next`
- `main` → `https://142vip.github.io/cdn_service/`
- `next` → `https://142vip.github.io/cdn_service/next/`

## README 模板

### 项目级 `apps/{project}/README.md`

```markdown
# {项目名}

{说明}

## 文件说明

| 文件/目录 | 说明 |
| --- | --- |
| `example.webp` | 示例 |

## CDN

https://cdn.jsdelivr.net/gh/142vip/cdn_service@main/apps/{project}/example.webp
```

## 已知遗留

- `apps/408/ukulele/` 部分中文/旧格式文件名
- `apps/ media/` 目录名前导空格
- 部分 `.png`/`.jpeg` 待迁移为 webp/jpg

## Git

- 分支：`main` / `next`
- 包管理：pnpm（workspace 仅 `site/`）
- Hooks：pre-commit `lint:fix`，commit-msg `verify-commit.ts`
