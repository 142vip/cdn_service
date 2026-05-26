# CDN Service 操作示例

## 示例 1：新增项目图片

**场景**：为 `vip-main` 添加一张背景图

```
1. 准备图片 hero-bg.jpg（850KB，1920x1080）
2. 校验：kebab-case ✓、jpg ✓、≤2MB ✓、无中文 ✓
3. 放入 apps/vip-main/daily/hero-bg.jpg
4. 更新 apps/vip-main/README.md 或对应子目录 README
5. 在图床管理界面确认 CDN 链接
6. git commit -m "feat(vip-main): add hero background image"
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

**场景**：为 `vip-main` 添加 Twitter 图标

```
1. 创建 apps/vip-main/svg/twitter.svg（≤2MB，纯矢量通常很小）
2. 更新 apps/vip-main/svg/README.md
3. 在图床管理界面确认 CDN 链接
4. git commit -m "feat(vip-main): add twitter svg icon"
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

## 示例 7：编辑图片故事

**场景**：为 142vip.cn 照片墙新增一条故事

```
1. pnpm dev:site
2. 侧栏选「图片故事」
3. 点击「新增故事」，填写标题、描述、分类（中文：旅游/运动/做菜/钓鱼/日常）
4. 从图床选图或填写 apps/vip-main/{folder}/... 路径
5. 保存后确认 apps/vip-main/photos.json 已更新
6. 双击图片集可全屏预览，切换分支/CDN 后复制链接
7. git commit -m "feat(vip-main): add photo story for ..."
```

侧栏「JSON文件」可预览/复制 photos.json。预览模式（`pnpm preview:site`）下图片故事与 JSON 均为只读。

## 示例 6：README 更新片段

新增 `apps/jsc/banner-home.jpg` 后，更新 `apps/jsc/README.md`：

```markdown
## 文件说明

| 文件 | 说明 |
| --- | --- |
| `logo-jsc.jpg` | 项目 Logo |
| `banner-home.jpg` | 首页 Banner 图 |
```
