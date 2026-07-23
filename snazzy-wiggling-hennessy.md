# dev-kit Monorepo 方案

## Context

sickle 项目的 `.claude/scripts/` 目录包含大量通用工具脚本（env、git、ai、gitlab、linear、sentry、figma、openrouter 等），需要提取为跨项目共享的 monorepo。目标是让每个项目的 `.claude/` 只需安装依赖 + 配置环境变量即可使用。

## Monorepo 结构

```
~/Desktop/Projects/dev-kit/
├── package.json                 # 根 package.json，bun workspaces
├── bun-workspace.yaml           # bun workspace 配置
├── tsconfig.json                # 根 tsconfig（paths 映射）
├── tsconfig.base.json           # 共享 tsconfig 基础配置
├── README.md
├── .gitignore
│
├── packages/
│   ├── core/                    # @lukailun/dev-kit
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── env/             # requireEnv, optionalEnv, envPath, is-ci
│   │       ├── git/             # getCurrentBranch, branch types, commit types, merge
│   │       ├── ai/              # getLanguageModel, generateObject, token-usage
│   │       ├── utils/           # retry, debug-fetch, getTimestamp
│   │       └── index.ts
│   │
│   ├── gitlab/                  # @lukailun/dev-kit-gitlab
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts        # GitLab client singleton
│   │       ├── branches/        # create-branch, create-feature/release/hotfix/experimental
│   │       ├── merge-requests/  # create/update/get MR, diff, reactions, auto-merge, review comments
│   │       ├── projects/        # get-project, get-projects, get-current-project-id
│   │       ├── users/           # get-current-user
│   │       └── index.ts
│   │
│   ├── github/                  # @lukailun/dev-kit-github（新增）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts        # Octokit client singleton
│   │       ├── branches/        # 对应 GitLab 的分支操作
│   │       ├── pull-requests/   # 对应 GitLab 的 MR 操作
│   │       └── index.ts
│   │
│   ├── linear/                  # @lukailun/dev-kit-linear
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts        # Linear client singleton
│   │       ├── issues/          # get/create/update issues, comments, states
│   │       ├── users/           # get users
│   │       ├── projects/        # get projects
│   │       └── index.ts
│   │
│   ├── sentry/                  # @lukailun/dev-kit-sentry
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts
│   │       ├── issues/          # get/list issues
│   │       ├── events/          # get/list events, extract API calls
│   │       └── index.ts
│   │
│   ├── figma/                   # @lukailun/dev-kit-figma
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts
│   │       ├── api-paths.ts
│   │       ├── nodes/           # get-node, get-nodes
│   │       ├── pages/           # get-pages, list-pages
│   │       ├── export/          # export-images
│   │       └── index.ts
│   │
│   ├── openrouter/              # @lukailun/dev-kit-openrouter
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── client.ts
│   │       ├── models/          # get-models, get-pricing, get-latest, get-popular
│   │       ├── model-id.ts
│   │       └── index.ts
│   │
│   ├── language-models/         # @lukailun/dev-kit-language-models
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── claude.ts
│   │       ├── deepseek.ts
│   │       ├── gemini.ts
│   │       ├── mimo.ts
│   │       ├── qwen.ts
│   │       ├── ...（其他 LLM provider）
│   │       └── index.ts
│   │
│   ├── review/                  # @lukailun/dev-kit-review
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── engine.ts        # review 核心引擎（规则遍历 + AI 判断）
│   │       ├── prompt.ts        # prompt 构建
│   │       ├── types.ts         # Violation, ReviewResult 等类型
│   │       ├── reaction.ts      # MR emoji reaction 管理
│   │       ├── create-rule.ts   # 交互式创建规则
│   │       ├── rules.ts         # 规则加载器（从项目本地读取）
│   │       └── index.ts
│   │
│   ├── workflow/                # @lukailun/dev-kit-workflow
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── commit-and-push.ts
│   │       ├── submit.ts
│   │       ├── create-merge-request.ts
│   │       ├── create-release.ts
│   │       ├── create-hotfix.ts
│   │       ├── publish-release.ts
│   │       ├── publish-hotfix.ts
│   │       ├── build-branch-receipt.ts
│   │       └── index.ts
│   │
│   ├── claudecode/              # @lukailun/dev-kit-claudecode
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── branch-usage.ts
│   │       ├── version.ts
│   │       └── index.ts
│   │
│   └── codex/                   # @lukailun/dev-kit-codex
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── branch-usage.ts
│           ├── version.ts
│           └── index.ts
│
├── cli/                         # @lukailun/dev-kit-cli
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── init.ts              # `dev-kit init` 生成项目 .claude/ 结构
│       └── index.ts
│
└── templates/
    └── project/                 # 项目模板（init 时复制）
        ├── CLAUDE.md.tmpl
        ├── package.json.tmpl
        ├── settings.json
        └── .env.template
```

## 包依赖关系

```
@lukailun/dev-kit (core)          ← 无内部依赖
@lukailun/dev-kit-gitlab          ← core
@lukailun/dev-kit-github          ← core
@lukailun/dev-kit-linear          ← core
@lukailun/dev-kit-sentry          ← core
@lukailun/dev-kit-figma           ← core
@lukailun/dev-kit-openrouter      ← core
@lukailun/dev-kit-language-models ← core, openrouter
@lukailun/dev-kit-review          ← core, gitlab（可选 github）
@lukailun/dev-kit-workflow        ← core, gitlab（可选 github, linear）
@lukailun/dev-kit-claudecode      ← core
@lukailun/dev-kit-codex           ← core
@lukailun/dev-kit-cli             ← core
```

## 项目使用方式

```bash
# 1. 在项目 .claude/ 下安装
cd .claude
bun add @lukailun/dev-kit @lukailun/dev-kit-gitlab @lukailun/dev-kit-workflow

# 2. 配置 .env
cp .env.template .env
# 编辑填入 GITLAB_TOKEN 等

# 3. 在脚本中使用
```

```typescript
// .claude/scripts/commit.ts
import { commitAndPush } from '@lukailun/dev-kit-workflow';
commitAndPush({ ai: 'mimo' });
```

## 从 sickle 迁移的内容

| sickle 路径 | → dev-kit 包 | 备注 |
|---|---|---|
| `scripts/env/*` | `packages/core/src/env/` | 全部迁移 |
| `scripts/git/*` | `packages/core/src/git/` | 全部迁移 |
| `scripts/ai/*` | `packages/core/src/ai/` | 全部迁移 |
| `scripts/utils/*` | `packages/core/src/utils/` | 全部迁移 |
| `scripts/gitlab/*` | `packages/gitlab/src/` | 全部迁移 |
| `scripts/linear/*` | `packages/linear/src/` | 全部迁移 |
| `scripts/sentry/*` | `packages/sentry/src/` | 迁移，移除 RN 特定逻辑 |
| `scripts/figma/*` | `packages/figma/src/` | 全部迁移 |
| `scripts/openrouter/*` | `packages/openrouter/src/` | 全部迁移 |
| `scripts/language-models/*` | `packages/language-models/src/` | 全部迁移 |
| `scripts/review/` | `packages/review/src/` | 只迁移框架，规则留给项目本地 |
| `scripts/workflow/*` | `packages/workflow/src/` | 迁移，移除 Linear 硬编码 |
| `scripts/claudecode/*` | `packages/claudecode/src/` | 全部迁移 |
| `scripts/codex/*` | `packages/codex/src/` | 全部迁移 |
| `scripts/exchange-rate/*` | `packages/core/src/utils/` | 合并到 utils |

## 不迁移的内容（留在项目本地）

- `review/coding-standards/` — 项目特定的编码规则
- `workflow/yolo.ts` — sickle 特定的 Linear issue 格式
- `settings.local.json` — 个人配置
- `.env` — 密钥文件

## 实施步骤

1. **初始化 monorepo 骨架** — package.json, bun-workspace.yaml, tsconfig
2. **迁移 core 包** — env, git, ai, utils, exchange-rate
3. **迁移 gitlab 包** — 22 个文件
4. **新增 github 包** — 参照 gitlab 包结构，用 Octokit 实现
5. **迁移 linear 包** — 13 个文件
6. **迁移 sentry, figma, openrouter 包**
7. **迁移 language-models 包**
8. **迁移 review 包** — 只迁移框架
9. **迁移 workflow 包** — 解耦 Linear 硬编码
10. **迁移 claudecode, codex 包**
11. **创建 cli 包** — `dev-kit init` 命令
12. **创建 templates** — 项目模板
13. **验证** — 在 openwiki 项目中测试安装和使用

## 验证方式

1. 在 openwiki 的 `.claude/` 中 `bun add @lukailun/dev-kit`
2. 写一个简单脚本 import core 的 env 工具并运行
3. 确认 TypeScript 类型正确解析
