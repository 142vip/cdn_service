# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.


## v0.0.1-alpha.0 (2026-05-27)

### ✨ Features

- 优化资源路径导出，支持`vip-main`应用资源 &nbsp;-&nbsp; by **chufan** [<samp>(477ab)</samp>](https://github.com/142vip/cdn_service/commit/477ab49)

### 💥 BREAKING CHANGES

- 移除 `VipCdnHost`、`CDN_DEFAULT_HOST`、`resolveVipCdnHost`、`buildProductionCdnAssetUrl`，统一使用 `CdnHostEnum`、`getDefaultCdnHost()`、`resolveCdnHost`、`getProductionCdnUrl`
- 移除 `LifePhotoItem` 类型导出，请在业务项目内自行定义

升级替换见 [README.md](./README.md#升级替换)。

**Release New Version v0.0.1-alpha.0 [👉 View New Package On NPM](https://www.npmjs.com/package/@142vip/cdn)**