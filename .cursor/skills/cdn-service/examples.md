# CDN Service 操作示例

## 示例 1：新增项目图片

**场景**：为 `main-vip` 添加一张背景图

```
1. 准备图片 hero-bg.jpg（850KB，1920x1080）
2. 校验：kebab-case ✓、jpg ✓、≤2MB ✓、无中文 ✓
3. 放入 apps/main-vip/hero-bg.jpg
4. 更新 apps/main-vip/README.md 文件表
5. 在图床管理界面确认 CDN 链接
6. git commit -m "feat(main-vip): add hero background image"
```

## 示例 2：重命名不合规文件

**场景**：发现 `apps/408/ukulele/借-毛不易-上.5s6zwqo65uc0.jpg`

```
旧：apps/408/ukulele/借-毛不易-上.5s6zwqo65uc0.jpg
新：apps/408/ukulele/jie-mao-buyi-part1.jpg

步骤：
1. 重命名文件
2. 更新 apps/408/ukulele/README.md
3. 搜索仓库内是否有引用旧路径并更新
4. git commit -m "refactor(408): rename ukulele images to kebab-case"
```

## 示例 3：PNG 转 WebP

**场景**：上传了 `wechat-qrcode.png`（1.2MB）

可在 `pnpm dev:site` 界面选中文件后点「转 WebP」，或命令行：

```bash
magick apps/media/wechat/wechat-qrcode.png -quality 85 -strip apps/media/wechat/wechat-qrcode.webp
rm apps/media/wechat/wechat-qrcode.png
```

更新 README 后提交：

```
git commit -m "refactor(media): convert wechat qrcode to webp"
```

## 示例 4：新增 SVG 图标

**场景**：为 `main-vip` 添加 Twitter 图标

```
1. 创建 apps/main-vip/svg/twitter.svg（≤2MB，纯矢量通常很小）
2. 更新 apps/main-vip/svg/README.md
3. 在图床管理界面确认 CDN 链接
4. git commit -m "feat(main-vip): add twitter svg icon"
```

## 示例 5：Agent 收到「上传图片」请求

Agent 应执行的完整流程：

```
用户：帮我把这张图加到 media/wechat 目录

Agent：
1. 读取本 Skill 确认规范
2. 检查图片大小和格式
3. 如为 PNG → 转 WebP（或 JPG）；如 >2MB → 压缩
4. 命名为 kebab-case（如 chu-fan-qrcode.webp）
5. 写入 apps/media/wechat/
6. 更新 apps/media/wechat/README.md
7. 汇报 CDN 链接
```

## 示例 6：README 更新片段

新增 `apps/jsc/banner-home.jpg` 后，更新 `apps/jsc/README.md`：

```markdown
## 文件说明

| 文件 | 说明 |
| --- | --- |
| `logo-jsc.jpg` | 项目 Logo |
| `banner-home.jpg` | 首页 Banner 图 |
```
