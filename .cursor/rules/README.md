# Cursor Rules（cdn_service）

本目录约束 Cursor Agent。通用流程来自 `@142vip/agent-skills` 按本仓精简；图床业务已全部写入本目录（不再使用 `.cursor/skills`）。

| 文件 | 作用 | 触发 |
| --- | --- | --- |
| `core-workflow.mdc` | 执行管线、最小改动、交付≠提交 | 始终 |
| `self-check.mdc` | 局部 lint / build 映射 | 始终 |
| `git-commit.mdc` | Conventional Commits、禁 trailer、禁擅自 push | 始终（执行仍须用户指令） |
| `cdn-playbook.mdc` | 上传流程、site UI、photos.json、发版 | 始终 |
| `code-standards.mdc` | TS/Vue 类型与命名 | `*.{ts,vue,js,…}` |
| `apps-media.mdc` | `apps/` 目录与图片规范 | `apps/**` |
| `site-and-cdn.mdc` | site 落点 + `@142vip/cdn` | `site/**` · `packages/cdn/**` · `scripts/**` |

## 分层

| 层 | 位置 | 说明 |
| --- | --- | --- |
| L0 | 根 `AGENTS.md` | 本仓边界与命令真源 |
| 编辑器强制 | **本目录** | Cursor 实际加载；含图床工作手册 |
| 通用镜像 | `.agents/skills/` | 包同步产物，**禁止手改**；改进回写 `@142vip/agent-skills` |

跨项目通用长文仍在 `.agents/skills/` 供其它工具消费；本仓 Cursor 开发以本目录 + `AGENTS.md` 为准。
