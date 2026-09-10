# AGENTS.md — cdn_service

本仓 Agent / Cursor 的 L0 真源。编辑器强制约束见 `.cursor/rules/`；`.agents/skills/` 为 `@142vip/agent-skills` 同步镜像，**禁止手改**。

## 仓库边界

| 路径 | 职责 | 禁止 |
| --- | --- | --- |
| `apps/` | 图床静态资源（按项目分目录） | 放入业务 TS/Vue 源码；中文文件名 |
| `site/` | Vue 3 + Vite 管理 / Pages 浏览界面 | 反向依赖 `apps/` 源码逻辑；配置散落多处 |
| `packages/cdn/` | `@142vip/cdn`（media + vip-main JSON + CDN 工具） | 手改 `assets/`、`*.generated.ts`（由 `pnpm sync:cdn` 生成） |
| `scripts/` | sync / commit-msg 等根脚本 | 与 site 业务 UI 耦合 |

- **唯一站点配置**：`site/src/site.config.ts`
- **CDN 包配置**：`packages/cdn/src/config.ts`（与 site 各自维护）
- workspace：`pnpm-workspace.yaml` 含 `site`；`apps/` 不进 workspace

## 栈摘要

- 包管理：`pnpm@9` · Node `>=18`
- 站点：Vue 3 · Vite · Element Plus · TypeScript
- 共享工具：优先 `@142vip/utils`，禁止重复造轮子
- Dev 端口：`7800`（vite）· Preview：`7810`（见 `site/vite.config.ts`）

## 常用命令

```bash
pnpm lint / pnpm lint:fix
pnpm dev:site          # 本地读写 apps/
pnpm build:site        # vue-tsc + vite build
pnpm preview:site
pnpm sync:cdn          # apps → packages/cdn/assets + generated
pnpm build:cdn         # sync + tsup
```

## Git

- Conventional Commits：`<type>(<scope>): <subject>`
- **scope**（`scripts/verify-commit.ts`）：`408` · `jsc` · `vip-main` · `vip-admin` · `scripts` · `media` · `site`
  - `packages/cdn` 相关：优先 `media`（资源同步）或 `scripts`（工具链）
- **禁止** Agent / IDE / 大模型 commit trailer（如 `Co-authored-by: Cursor`）
- Agent：**仅用户明确要求时** `git commit`；**不执行** `git push`

## 图床资源规范（摘要）

| 规则 | 要求 |
| --- | --- |
| 格式 | `.webp` / `.jpg` / `.svg` / `.ico`（JSON 另议） |
| 大小 | ≤ 2MB（`site.config` / `validate.ts`） |
| 命名 | kebab-case，无中文 |
| media / vip-main JSON 变更后 | 执行 `pnpm sync:cdn`（发版前 `pnpm build:cdn`） |

细节：`.cursor/rules/cdn-playbook.mdc` · `apps-media.mdc` · `apps/**/README.md`

## 知识写回

| 发现 | 写回 |
| --- | --- |
| 本仓边界 / 命令 / scope | 本文件 |
| Cursor 强制约束（含图床手册） | `.cursor/rules/*.mdc` |
| 跨项目通用流程 | `@142vip/agent-skills` 真源（勿只改 `.agents/skills` 镜像） |
