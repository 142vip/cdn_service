# CDN Service 参考文档

## 项目目录（apps/）

| 目录 | 用途 |
| --- | --- |
| `408` | 408CSFamily |
| `jsc` | JavaScriptCollection |
| `vip-main` | 142vip 主站（含 `photos.json` 照片墙数据） |
| `media` | 自媒体（注意历史目录 ` media` 含前导空格） |
| `vip-admin` | VIP 管理端（预留） |

## npm 包 @142vip/cdn

路径：`packages/cdn/`，脚本：`scripts/sync-media.ts`

```bash
pnpm sync:cdn        # 同步 apps/media → MEDIA_SRC
pnpm build:cdn       # 构建 ESM/CJS
pnpm prepublish:cdn  # dry-run 预发布
pnpm publish:cdn     # 发布 npm
```

配置：`packages/cdn/src/config.ts`（与 site 逻辑一致，独立维护）

## 配置入口

**唯一配置文件**：`site/src/site.config.ts`

```typescript
siteConfig.cdn // defaultHost, production, development, domains
siteConfig.allowedExtensions // jpg | webp | svg
siteConfig.maxFileSize // 2MB
siteConfig.footer // 页脚、ICP、百度统计 ID
siteConfig.photoStories // photos.json 路径与分类（旅游、运动、做菜、钓鱼、日常）
siteConfig.hiddenTreeEntries // 目录树隐藏项（如 photos.json）
```

修改 CDN 域名或分支后重新 `pnpm build:site` 部署。

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

## CDN 环境

| 环境 | 分支 | 用途 |
| --- | --- | --- |
| 生产 | `main` | 线上稳定引用 |
| 开发 | `next` | 日常开发调试 |

默认域名：`cdn.statically.io`（Statically）

备选：`cdn.jsdelivr.net`、`fastly.jsdelivr.net`

## site 架构

```
plugins/apps-fs.ts      扫描树、文件 CRUD、合规校验
plugins/local-apps.ts   dev：/__local/* API + /apps/* 静态预览
plugins/photos-json.ts  photos.json 读写与校验
plugins/manifest.ts     build：写入 src/assets/manifest.json → dist/

composables/
  useLocalFiles.ts      dev 模式 API 客户端
  useManifest.ts        Pages 模式读 manifest
  useFileBrowser.ts     目录树、搜索、选中
  usePhotoStories.ts    photos.json CRUD（dev）/ manifest 只读（预览）

components/
  PhotoStoriesPanel.vue 照片墙 CRUD、排序、画廊预览
  PhotosJsonView.vue    photos.json 只读 JSON 视图
  StoryImagePreview.vue 全屏图片预览

utils/
  validate.ts           前端校验与命名建议
  cdn.ts                CDN URL 生成
  crop-name.ts          裁剪文件名建议
  convert.ts            压缩、webp 转换
```

## 照片故事（photos.json）

- 数据文件：`apps/vip-main/photos.json`（`LifePhotoItem[]`）
- 分类字段 `category` 使用中文：`旅游` | `运动` | `做菜` | `钓鱼` | `日常`
- 图片路径：`apps/vip-main/{folder}/...` 或外链 `https://...`
- dev API：`GET/PUT /__local/photos`；构建时 `manifest.json` 嵌入 `photoStories`
- 侧栏：下拉选「图床目录 / 照片故事」；照片故事子菜单「照片墙 / photos.json」
- 持久化键：`cdn-site-sidebar-view`、`cdn-site-stories-sub-view`

## 部署

Workflow：`.github/workflows/deploy-pages.yml`

- 触发：`push` 到 `main` / `next`
- 访问地址：`https://142vip.github.io/cdn_service/`
- `main` / `next` 推送均会触发部署，Pages 地址相同

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
