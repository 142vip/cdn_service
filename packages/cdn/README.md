# @142vip/cdn

142vip 图床 npm 包：**npm 包内静态资源** + **CDN URL 工具**，支持 ESM / CJS。

包含 `apps/media` 图片资源与 `apps/vip-main` JSON 数据（如 `photos.json`）。

## 安装

```bash
pnpm add @142vip/cdn
```

## 最佳实践

| 场景 | 推荐方式 |
| --- | --- |
| 前端页面、组件内图片 | `import` 包内 media 资源，随项目构建与缓存 |
| 前端读取照片墙 JSON | `import` `@142vip/cdn/vip-main/photos.json` |
| 需要统一资源 key、类型提示 | `MEDIA_SRC` / `VIP_MAIN_SRC` |
| 线上文档、邮件、API 返回 JSON CDN 链接 | `VIP_MAIN_CDN` 或 `getVipMainProductionCdnUrl` |
| 线上文档、邮件、API 返回图片 CDN 链接 | `getProductionCdnUrl`（main + Statically） |
| 联调 next 分支未发布资源 | `getDevelopmentCdnUrl`（next + Statically） |
| 切换 CDN 域名或分支 | `getCdnUrl(path, { host, branch })` |

**优先 import，其次 CDN 外链。** 前端项目应尽量走 npm 包静态资源，减少对外部 CDN 的运行时依赖。

### 前端：import 资源

```vue
<script setup lang="ts">
import githubIcon from '@142vip/cdn/media/svg/github.svg'
import wechatCode from '@142vip/cdn/media/wechat/chu-fan-code.jpg'
</script>

<template>
  <img :src="githubIcon" alt="GitHub">
  <img :src="wechatCode" alt="微信公众号">
</template>
```

### 类型安全的资源 key

`MEDIA_SRC` 由仓库 `apps/media` 同步生成：

```ts
import { MEDIA_SRC } from '@142vip/cdn'

const githubPath = MEDIA_SRC.svg.github
// '@142vip/cdn/media/svg/github.svg' — 供 bundler 解析或动态 import
```

### vip-main JSON（photos.json）

`VIP_MAIN_SRC` / `VIP_MAIN_CDN` 由仓库 `apps/vip-main` 同步生成：

```ts
import type { LifePhotoItem } from '@142vip/cdn'
import {
  getVipMainProductionCdnUrl,
  VIP_MAIN_CDN,
  VIP_MAIN_SRC,
} from '@142vip/cdn'
import photos from '@142vip/cdn/vip-main/photos.json'

const items = photos as LifePhotoItem[]

// 包内 import 路径
const photosExport = VIP_MAIN_SRC.photos
// '@142vip/cdn/vip-main/photos.json'

// CDN 外链
const prodUrl = VIP_MAIN_CDN.photos.production
// 或
const prodUrl2 = getVipMainProductionCdnUrl('photos.json')
```

### CDN 外链

路径相对于 `apps/`，不含 `apps/` 前缀：

```ts
import {
  getCdnUrl,
  getDevelopmentCdnUrl,
  getProductionCdnUrl,
} from '@142vip/cdn'

const prodUrl = getProductionCdnUrl('media/svg/github.svg')
const devUrl = getDevelopmentCdnUrl('media/wechat/chu-fan-code.jpg')
const customUrl = getCdnUrl('media/svg/github.svg', {
  host: 'cdn.jsdelivr.net',
  branch: 'main',
})
```

### Node.js（ESM / CJS）

```ts
import { getProductionCdnUrl, MEDIA_SRC } from '@142vip/cdn'

export const avatarUrl = getProductionCdnUrl('media/wechat/chu-fan-code.jpg')
export const githubExport = MEDIA_SRC.svg.github
```

```js
const { getProductionCdnUrl } = require('@142vip/cdn')

module.exports.wechatUrl = getProductionCdnUrl('media/wechat/chu-fan-code.jpg')
```

## API

| 导出 | 说明 |
| --- | --- |
| `MEDIA_SRC` / `MediaSrc` | media 资源路径映射 |
| `VIP_MAIN_SRC` / `VipMainSrc` | vip-main JSON 包内路径映射 |
| `VIP_MAIN_CDN` / `VipMainCdn` | vip-main JSON CDN 链接（production / development） |
| `mediaExportPath(path)` | 构造 media 包内 export 路径 |
| `vipMainExportPath(path)` | 构造 vip-main JSON 包内 export 路径 |
| `getVipMainCdnUrl(path, options?)` | vip-main JSON CDN URL |
| `getVipMainProductionCdnUrl(path, host?)` | vip-main JSON 生产环境 CDN URL |
| `getVipMainDevelopmentCdnUrl(path, host?)` | vip-main JSON 开发环境 CDN URL |
| `LifePhotoItem` | photos.json 单条数据类型 |
| `getCdnBase(options?)` | CDN apps 根 URL |
| `getCdnUrl(path, options?)` | 完整 CDN 文件 URL |
| `getProductionCdnUrl(path, host?)` | 生产环境（main） |
| `getDevelopmentCdnUrl(path, host?)` | 开发环境（next） |
| `getDefaultCdnHost()` | 默认 Statically |
| `getDefaultCdnBranch()` | 默认 next |
| `getCdnDomains()` | 可选 CDN 域名列表 |

## 本仓库维护

在 monorepo 根目录：`pnpm sync:cdn` · `pnpm build:cdn` · `pnpm prepublish:cdn` · `pnpm publish:cdn`

新增 CDN 域名：编辑 `src/config.ts` 的 `domains` 数组。

## 证书

MIT © 2019-present 142vip 储凡
