# photos

照片墙（`photos.json`）对应的图片与封面，按中文分类分子目录存放。

## 子目录

| 目录 | 分类 | 说明 |
| --- | --- | --- |
| [travel](./travel) | 旅游 | 出行、风景、地标 |
| [sports](./sports) | 运动 | 健身、户外运动 |
| [cooking](./cooking) | 做菜 | 美食、厨房 |
| [fishing](./fishing) | 钓鱼 | 垂钓、水域 |
| [daily](./daily) | 日常 | 随手拍、生活记录 |

## 路径约定

图床路径格式：

```
apps/vip-main/photos/{分类目录}/{文件名}.webp
```

示例：

```
apps/vip-main/photos/travel/kyoto-temple.webp
apps/vip-main/photos/daily/coffee-morning.webp
```

CDN 示例：

```
https://cdn.statically.io/gh/142vip/cdn_service@main/apps/vip-main/photos/daily/example.webp
```

## 与 photos.json 的关系

- 每条故事的 `images[]` 可引用本子目录下的文件，或使用外链
- 列表封面通常取 `images[0]`
- 新增图片后请在对应子目录 README 中补充说明
