# videos

视频列表（[`videos.json`](../videos.json)）相关本地资源，如封面、占位图。

## 子目录

| 目录 | 说明 |
| --- | --- |
| [self](./self) | 自制 / 剪辑类视频封面或配图 |

## 路径约定

```
apps/vip-main/videos/{子目录}/{文件名}.webp
```

示例：

```
apps/vip-main/videos/self/spring-festival-clip.webp
```

## 与 videos.json 的关系

- 条目 `videos[]` 通常为 B 站等外链，不强制本地文件
- 若需自定义封面，可将图片放在本目录并在业务侧引用 CDN 路径

## 文件说明

| 文件 | 说明 |
| --- | --- |
| `self/3b110e18652b2fb263561247e6052e4a4cf02f0a-1005x565.jpg` | 示例配图 |
