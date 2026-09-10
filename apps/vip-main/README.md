# vip-main

142vip 主站静态资源与 JSON 数据，供 142vip.cn 照片墙、视频列表、公众号文章等模块引用。

## 目录说明

| 目录 | 数据文件 | 说明 |
| --- | --- | --- |
| [photos](./photos) | [`photos.json`](./photos.json) | 照片墙图片与封面，按生活场景分子目录 |
| [videos](./videos) | [`videos.json`](./videos.json) | B 站等外链视频条目，本地仅存封面或占位图 |
| [we-chat](./we-chat) | [`we-chat.json`](./we-chat.json) | 公众号文章列表，本地存放封面图 |

## JSON 数据

### photos.json（照片墙）

类型为 `LifePhotoItem[]`，字段见 [`photos/README.md`](./photos/README.md)。

- `images`：图片路径数组，推荐 `apps/vip-main/photos/{分类}/...` 或外链 `https://...`
- 分类与目录对应：`旅游` → `photos/travel`，`运动` → `photos/sports`，`做菜` → `photos/cooking`，`钓鱼` → `photos/fishing`，`日常` → `photos/daily`

### videos.json（视频列表）

- `videos`：视频链接数组（如 B 站 URL）
- 封面可选放在 `videos/` 下，路径写入 JSON 或沿用外链

### we-chat.json（公众号文章）

- `coverUrl`：封面地址，推荐 `apps/vip-main/we-chat/{articleId}.webp` 或外链
- `articleId`：文章唯一 ID，与本地封面文件名对应

## 本地管理

- 侧栏「图片故事」编辑 `photos.json`（dev 可写，预览只读）
- 图床管理双击 JSON 可预览；构建后 `photos.json` 嵌入 `manifest.json`

npm 包 `@142vip/cdn` 会同步打包 JSON 至 `assets/vip-main/`，执行 `pnpm sync:cdn` 更新。

## 规范

- 位图优先 `.webp`，图标用 `.svg`
- 文件名 kebab-case，禁止中文
- 单文件 ≤ 2MB
- 新增或变更文件请同步更新对应目录 README
