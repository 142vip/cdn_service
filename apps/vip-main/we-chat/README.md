# we-chat

公众号文章（[`we-chat.json`](../we-chat.json)）对应的封面图。

## 路径约定

推荐将封面放在本目录，并在 JSON 的 `coverUrl` 中引用：

```
apps/vip-main/we-chat/{articleId}.webp
```

示例：

| 字段 | 值 |
| --- | --- |
| `articleId` | `2247485249` |
| `coverUrl` | `apps/vip-main/we-chat/2247485249.webp` |

仍可使用微信 CDN 等外链；本地封面便于图床统一管理与 CDN 加速。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| — | 暂无（可按 `articleId` 命名新增封面） |
