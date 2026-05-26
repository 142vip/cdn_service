# vip-main

142vip 主站静态资源，按生活场景分类存放图片。

## 目录说明

| 目录 | 说明 |
| --- | --- |
| [travel](./travel) | 旅游出行 |
| [sports](./sports) | 运动健身 |
| [cooking](./cooking) | 做菜美食 |
| [fishing](./fishing) | 钓鱼休闲 |
| [daily](./daily) | 日常生活 |

## 图片故事

[`photos.json`](./photos.json) 管理 142vip.cn 站点照片墙数据，类型为 `LifePhotoItem[]`：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一编号 |
| `title` | 标题 |
| `description` | 描述（支持换行） |
| `category` | 中文分类：`旅游` / `运动` / `做菜` / `钓鱼` / `日常` |
| `date` | 日期 `YYYY-MM-DD` |
| `images` | 图片路径数组（`apps/vip-main/...` 或 `https://...`） |
| `location` | 可选，地点 |
| `tags` | 可选，标签数组 |

本地开发时可通过管理界面侧栏「图片故事」编辑；「JSON文件」视图可预览/复制 JSON；构建后数据嵌入 `manifest.json` 供 GitHub Pages 只读展示。

## 规范

- 位图优先 `.webp`，图标用 `.svg`
- 文件名 kebab-case，禁止中文
- 单文件 ≤ 2MB
- 新增或变更文件请同步更新对应目录 README
