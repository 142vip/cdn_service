# @142vip/cdn-service

142vip平台相关cdn业务，提供静态资源加速访问服务

## 访问方式

- 格式：`支持的CDN域名/gh/账号名/仓库名/@分支名/多重文件名`

例如：https://cdn.statically.io/gh/142vip/cdn_service@main/we_media/qr_code/wechat_code.jpg

## 安装

```shell
# 下载依赖
pnpm i
```

## 生成链接

```shell
# 执行脚本，生成图片的访问链接
./scripts/link
```

## 发布版本

```shell
# 交互命令框
pnpm release
```

## 参考

- [picX](https://github.com/XPoet/picx)
- [@142vip/utils](https://www.npmjs.com/package/@142vip/utils)
- [@142vip/fairy-cli](https://www.npmjs.com/package/@142vip/fairy-cli)
- [@142vip/commit-linter](https://www.npmjs.com/package/@142vip/commit-linter)
- [@142vip/eslint-config](https://www.npmjs.com/package/@142vip/eslint-config)

## 证书

```text
The MIT License (MIT)

Copyright (c) 2019-present 142vip 储凡

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
