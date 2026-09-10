# apps

142vip 平台各项目的静态资源目录，通过 GitHub CDN 提供图床访问服务。

## 目录说明

| 目录 | 说明 |
| --- | --- |
| [408](./408) | 408CSFamily 项目资源 |
| [jsc](./jsc) | JavaScriptCollection 项目资源 |
| [vip-main](./vip-main) | 142vip 主站（`photos/` · `videos/` · `we-chat/` 与 JSON 数据） |
| [media](./%20media) | 自媒体宣传资源（公众号等，同步至 `@142vip/cdn`） |
| [vip-admin](./vip-admin) | VIP 管理端资源（预留） |

## 访问方式

```
https://cdn.statically.io/gh/142vip/cdn_service@{分支名}/apps/{目录}/{文件名}
```

其他项目可通过 npm 包 `@142vip/cdn` 直接 `import` media 图片与 vip-main JSON，详见 [packages/cdn/README.md](../packages/cdn/README.md)。
