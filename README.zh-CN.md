# @oc-plugins/vibe-prd

![npm version](https://img.shields.io/npm/v/@oc-plugins/vibe-prd)
![license](https://img.shields.io/npm/l/@oc-plugins/vibe-prd)

📖 [English](README.md) | 中文

一个 [OpenCode](https://opencode.ai) 插件，将自然语言产品目标转化为可追踪、可审核、可实施的功能集合。

该插件驱动结构化工作流：**发现 → PRD 撰写 → 功能分解 → 审核 → 规划 → OpenSpec 生成 → 进度追踪**。每个阶段都会在工作区写入真实文件并持久化工作流状态，因此工作可以随时恢复、检查和恢复。

---

## 功能特性

- 通过结构化发现捕获产品目标、角色、约束和成功标准
- 撰写并审核 Master PRD 文档
- 将已批准的 PRD 分解为具有依赖关系的功能候选
- 在任何实施开始之前，为每个功能运行结构化审核循环
- 生成可追踪的任务列表作为实施计划
- 从已批准的计划生成并同步 OpenSpec 变更制品
- 报告跨多个功能的工作流和任务进度

---

## 安装

通过 npm 或 Bun 安装插件：

```bash
bun add @oc-plugins/vibe-prd
# 或
npm install @oc-plugins/vibe-prd
```

在 OpenCode 配置中添加插件：

```jsonc
// ~/.config/opencode/opencode.json
{
  "plugin": ["@oc-plugins/vibe-prd"]
}
```

插件需要 [Bun](https://bun.sh) v1.3 或更高版本以及 TypeScript 6。

### 本地开发

用于本地开发或测试而不发布：

```bash
git clone https://github.com/ecafe8/oc-plugin-prd.git
cd oc-plugin-prd
bun install
bun run build
```

然后在 OpenCode 配置中引用构建的文件：

```jsonc
{
  "plugin": ["path/to/oc-plugin-prd/dist/index.js"]
}
```

### OpenSpec 依赖

本插件需要 [OpenSpec](https://github.com/openspecio/openspec) 来支持规范驱动的开发工作流。OpenSpec 用于从已批准的功能计划生成、追踪和同步实施制品。

全局安装 OpenSpec：

```bash
bun install -g openspec
# 或
npm install -g openspec
```

在你的项目中初始化 OpenSpec：

```bash
openspec init --tools opencode
```

这将创建 `openspec/` 目录结构并设置 OpenCode 集成，包括技能（skills）和命令（commands）。

**OpenSpec 文档和资源：**

- 仓库：https://github.com/openspecio/openspec
- 版本：兼容 OpenSpec v1.3.0 或更高版本

---

## 配置

插件从两个来源读取配置，在运行时合并。工作区配置优先于用户配置。

### 工作区配置 — `.vibe/config.yaml`

在运行任何 PRD 工作流工具之前，在项目根目录创建此文件。

**最小配置**（所有角色使用 OpenCode 默认模型）：

```yaml
models: {}

workflow:
  autoSyncOpenSpec: true
  configErrorSeverity: block
```

**完整配置**（为每个角色指定模型）：

```yaml
models:
  drafting:
    model: claude-opus-4-5  # 用于 PRD 和功能撰写的模型
  review:
    model: claude-sonnet-4-5  # 用于结构化审核评论的模型

workflow:
  autoSyncOpenSpec: true         # 在计划生成时同步 OpenSpec
  configErrorSeverity: block     # 配置缺失时阻止或警告
```

`models.drafting` 和 `models.review` 都是可选的。当缺失时，插件会回退到 OpenCode 默认模型。你也可以使用 `switch_model` 工具在运行时切换模型。

`configErrorSeverity: block`（默认）会导致所有 PRD 工具在 `.vibe/config.yaml` 缺失或无效时拒绝运行。设置为 `warn` 以允许工作流继续进行并显示警告。

### 用户配置 — `~/.config/opencode/oc-plugin-prd.jsonc`

可选的用户级覆盖。对于两者都定义的任何字段，工作区配置优先于此文件。

```jsonc
{
  "models": {
    "drafting": { "model": "claude-opus-4-5" }
  }
}
```

### 运行时切换模型

模型可以在会话期间更改，无需重启 OpenCode。`switch_model` 工具更新 `.vibe/config.yaml` 并立即对后续工具调用生效。

```
switch_model
  role: "drafting" | "review"
  model: "claude-opus-4-5"
```

示例 — 用自然语言告诉 agent：

> "把审核模型切换到 claude-opus-4-5"

Agent 调用 `switch_model(role: "review", model: "claude-opus-4-5")` 并确认更改。下一次 `master_prd_draft` 或 `review_loop_execute` 调用将使用新模型。

你也可以直接编辑 `.vibe/config.yaml` — 由于每次工具调用都会从磁盘读取配置，更改会在下次调用时生效。

---

## 核心概念

插件维护两个独立的制品层，它们协同工作但职责不同。

### Tracker — `.vibe/tracker.yaml`

Tracker 是**工作流阶段的权威来源**。它记录：

- 当前工作流状态（如 `feature_review`、`implementation_ready`）
- 功能列表及其状态
- 附加到每个功能的任务记录
- 变更请求和活动的变更请求 ID

在工作流阶段问题上，Tracker 永远不会输给 OpenSpec。如果 OpenSpec 和 Tracker 对工作所处阶段存在分歧，Tracker 优先。

### OpenSpec — `openspec/changes/`

OpenSpec 变更文件是**实施任务进度的权威来源**。它们记录：

- 哪些实施任务被标记为完成
- 功能可追溯性（源功能 ID、标题、计划引用）
- 功能之间的依赖链接

当运行 `openspec_sync` 时，OpenSpec 中记录的任务级完成情况会应用到 Tracker。Tracker 的工作流阶段永远不会被此同步覆盖。

### 发现制品 — `.vibe/discovery/`

| 文件 | 用途 |
|------|------|
| `context.yaml` | 结构化的目标、角色、约束、假设、成功标准 |
| `summary.md` | 供 PRD 撰写提示使用的可读发现摘要 |
| `questions.md` | 发现期间捕获的未解决问题 |

### 功能制品 — `docs/features/feat-<slug>/`

每个物化的功能都有自己的目录：

| 文件 | 用途 |
|------|------|
| `index.md` | 功能标识、来源可追溯性、依赖链接 |
| `01-foundation.md` | 问题框架和范围 |
| `02-product.md` | 产品需求 |
| `03-ui-ux.md` | UI/UX 需求（可选） |
| `04-technical.md` | 技术需求 |
| `05-plan.md` | 实施任务列表 |
| `review.yaml` | 审核记录（决策、历史、循环状态） |

### 其他追踪路径

| 路径 | 用途 |
|------|------|
| `docs/master-prd.md` | Master PRD 文档 |
| `.vibe/candidates.yaml` | 等待确认的待处理功能候选 |
| `.vibe/reviews/` | 按功能 ID 索引的审核记录 |
| `.vibe/changes/` | 变更请求目录 |

---

## 标准工作流

插件暴露两个 agent：

- **orchestrator** — 协调工作流并为当前状态选择合适的工具（主模式）
- **reviewer** — 根据结构化质量门评估 PRD 制品（子 agent 模式）

按顺序通过这些阶段。每个阶段产生文件制品，供下一阶段使用。

### 阶段 1 — 发现

**目标**：通过多轮讨论捕获足够的结构化上下文，以起草一致的 PRD。

工具：`discovery_capture`、`discovery_update`、`discovery_status`、`discovery_confirm`

```
discovery_capture
  args: goal, actors, constraints, assumptions, successMeasures
  writes: .vibe/discovery/context.yaml
          .vibe/discovery/summary.md

discovery_update
  args: goal?, actors?, constraints?, assumptions?, successMeasures?, resolvedQuestions?, newQuestions?
  将新信息合并到现有发现上下文中 — 可根据需要多次调用
  当核心字段变化时会重置确认状态（见下文）

discovery_status
  returns: 三态就绪检查 — 字段不全 / 待确认 / 已确认

discovery_confirm
  requires: 必填字段已经完整
  effect: 显式标记发现已确认，可以开始起草
```

必填字段（`goal`、`actors`、`successMeasures`）齐全只是门禁的一半。`master_prd_draft` 还需要显式调用 `discovery_confirm` — 插件不会在字段刚好填齐的那一刻就开始起草。这样讨论可以横跨多轮 `discovery_capture`/`discovery_update`，直到用户明确确认发现阶段已经完成。

如果确认之后 discovery 内容又发生了变化（通过 `discovery_update` 修改了 `goal`、`actors`、`constraints`、`assumptions` 或 `successMeasures`），确认状态会自动重置，必须重新调用 `discovery_confirm`。只涉及未解决问题的更新不会重置确认状态。

### 阶段 2 — Master PRD 撰写

**目标**：生成经过审核和批准的 Master PRD 文档。

工具：`master_prd_draft`、`master_prd_submit`、`master_prd_review`

```
master_prd_draft
  不带 content 参数：返回撰写模型的提示
  带 content 参数：写入 docs/master-prd.md
                   推进工作流 → master_prd_drafting

master_prd_submit
  requires: docs/master-prd.md 存在
  推进工作流 → master_prd_review

master_prd_review
  args: approved (bool), summary
  writes: .vibe/reviews/master-prd.yaml
  如果批准：推进工作流 → feature_splitting
  如果拒绝：返回       → master_prd_drafting
```

### 阶段 3 — 功能分解

**目标**：将批准的 PRD 拆分为已确认、已物化的功能目录。

工具：`feature_candidates_generate`、`feature_candidates_materialize`

```
feature_candidates_generate
  requires: Master PRD 审核已批准
  args: masterPrdReviewPath, candidates[]
  writes: .vibe/candidates.yaml
  output: 供用户确认的候选列表

feature_candidates_materialize
  args: confirmedSlugs[]
  reads: .vibe/candidates.yaml
  writes: 为每个确认的候选生成 docs/features/feat-<slug>/
  推进工作流 → feature_splitting
```

未包含在 `confirmedSlugs` 中的候选将被丢弃。候选之间的依赖关系记录在每个功能的 `index.md` 中。

### 阶段 4 — 功能审核

**目标**：批准每个功能以进行实施规划。

工具：`feature_review`

```
feature_review
  args: featureId, approved (bool), summary
  writes: docs/features/<id>/review.yaml
          .vibe/reviews/<id>.yaml
  如果批准：功能状态 → awaiting_confirmation
            工作流   → awaiting_user_confirmation
  如果拒绝：功能状态 → in_review
            工作流   → feature_review
```

被拒绝的功能进入受控修订路径。功能文档被保留；在功能可以推进之前，只需要新的审核迭代。审核历史在迭代之间累积。

### 阶段 5 — 实施规划

**目标**：为每个批准的功能生成结构化的任务列表。

工具：`plan_generate`

```
plan_generate
  args: featureId, steps[]
  requires: 功能审核已批准
  guard:    如果功能已经是 implementation_in_progress 或 done 则阻止
  writes: docs/features/<id>/05-plan.md
  updates: tracker 功能任务
  advances: 功能状态 → implementation_ready
            工作流   → implementation_ready
```

对于相同的输入，计划是幂等的。如果功能已经是 `implementation_in_progress`，工具会阻止调用并返回明确消息 — 改用 `change_request_apply` 来记录范围变更。

### 阶段 6 — OpenSpec 生成和同步

**目标**：从批准的计划创建和维护 OpenSpec 实施制品。

工具：`openspec_generate`、`openspec_sync`

```
openspec_generate
  args: featureId
  requires: 功能状态是 implementation_ready 或 implementation_in_progress
  writes or updates: openspec/changes/<featureId>.md
  如果是新文件：isUpdate = false, 功能 → implementation_in_progress
  如果是更新：  isUpdate = true, 原地更新（不重复）

openspec_sync
  args: featureId, taskDoneIds[]
  reads: openspec/changes/<featureId>.md
  compares: OpenSpec 任务状态 vs tracker 任务状态
  结果类型：
    no_op         — 系统已一致，无需写入
    safe_update   — OpenSpec 有 tracker 不知道的完成项；应用它们
    conflict      — tracker 有 OpenSpec 仍显示为 pending 的已完成任务；返回修复指导
    manual_follow_up — 同时存在安全更新和冲突；需要操作员审查
```

### 阶段 7 — 进度追踪

**目标**：了解整个工作流的当前状态。

工具：`progress_snapshot`

```
progress_snapshot
  reads: .vibe/tracker.yaml
  returns: 工作流状态、按状态分类的功能计数、任务计数、变更请求摘要
           当存在阻塞器或 replan_required 功能时发出警告
```

---

## 重复运行和无操作行为

插件的设计使选定操作可以安全地重复运行。

| 操作 | 重复运行行为 |
|------|-------------|
| `openspec_generate` | 原地更新制品；返回 `isUpdate: true` |
| `openspec_sync` 无变更 | 返回 `no_op` 结果；不写入 tracker |
| `plan_generate`（相同步骤） | 覆盖 `05-plan.md`；生成相同的任务结构 |
| `plan_generate` 在 `implementation_in_progress` 上 | **阻止**；返回错误消息 |
| `discovery_capture` / `discovery_update` | 将新上下文与现有合并；对相同输入幂等 |
| `discovery_update` 修改核心字段 | 重置 `discovery_confirm` 状态；需要在起草前重新确认 |

当 `openspec_sync` 返回 `no_op` 结果时，无需进一步操作。这是 tracker 和 OpenSpec 在任务状态上已一致时的预期结果。

---

## 恢复和故障排除

### 配置缺失或无效

如果 `.vibe/config.yaml` 缺失且 `configErrorSeverity` 是 `block`（默认），所有 PRD 工具将拒绝运行并返回配置验证错误。

**修复**：创建至少包含空 models 块的 `.vibe/config.yaml`：

```yaml
models: {}
```

### 发现字段看起来齐全，但 Master PRD 起草仍被阻止

`master_prd_draft` 和 `master_prd_generate` 都同时需要**必填字段完整**和**显式调用 `discovery_confirm`**。运行 `discovery_status` 检查当前状态：

- `no (fields incomplete)` — 使用 `discovery_update` 补齐缺失字段
- `no (pending confirmation)` — 字段已齐全；在用户已经审阅过发现摘要后运行 `discovery_confirm`
- `yes` — 已确认；`master_prd_draft` / `master_prd_generate` 可以继续

如果在此前确认之后 discovery 内容又发生了变化，确认状态会自动重置，需要再次调用 `discovery_confirm`。像重复添加一个已存在的 actor 这样的无操作更新，不会重置确认状态。

### 审核被拒绝

当功能审核被拒绝时：

- 功能状态 → `in_review`
- 工作流状态 → `feature_review`
- 现有文档制品（`01-foundation.md` 到 `04-technical.md`）被保留
- 只有 `review.yaml` 需要用新的审核决策更新

在功能可以推进之前需要新的审核迭代。审核历史在迭代之间累积，并可在 `review.yaml` 中查看。

### 变更请求后需要重新规划

当对进行中的功能调用 `change_request_apply` 时：

- 功能状态 → `replan_required`
- 工作流状态 → `replan_required`
- 基础和产品文档被保留
- 应用范围变更后必须重新生成 `05-plan.md`

恢复方法：处理变更请求，使用 `plan_generate` 重新生成计划，然后使用 `openspec_generate` 重新生成 OpenSpec 制品。

### OpenSpec 同步返回冲突

**冲突**意味着 tracker 有标记为完成的任務，而 OpenSpec 制品仍显示为 pending。Tracker 优先 — 不更改 tracker 状态。

同步输出包括修复指导：

```
Sync result for feat-billing [conflict]:
  Conflicts (tracker authoritative — 1 task(s) need manual OpenSpec update):
    BILL-1: tracker=done, openspec=pending

  Repair guidance:
  1 task(s) are marked done in the tracker but still pending in the OpenSpec artifact.
  To reconcile, open openspec/changes/feat-billing.md and mark the following task(s) as done:
    - [ ] → [x]  BILL-1
  Then rerun openspec_sync to confirm alignment.
```

### OpenSpec 同步返回 manual_follow_up

**manual_follow_up** 结果意味着同一次同步中同时存在安全更新和冲突。先应用安全更新，然后在重新运行同步之前手动解决冲突。

### 工作流状态似乎卡住

运行 `progress_snapshot` 查看当前工作流状态、功能状态、任务计数和任何活动的变更请求。快照输出在存在阻塞器或需要重新规划的功能时包括警告。

---

## 示例：账单工作区

此场景匹配已验证的 dogfooding 基线。

### 1. 捕获发现上下文

```
discovery_capture
  goal: "创建帮助财务团队管理发票收入和对账的账单工作区。"
  actors: ["财务经理", "账单操作员"]
  constraints: ["必须保留审计历史"]
  successMeasures: ["发票收入任务一致分配"]
```

可能需要多轮 `discovery_capture` / `discovery_update` 才能补齐所有必填字段 — 随时可以用 `discovery_status` 检查还缺什么。

### 2. 确认发现阶段已完成

```
discovery_status
  # 确认必填字段齐全，没有缺失字段报告

discovery_confirm
  # 标记发现已确认，可以开始起草
```

### 3. 起草并提交 Master PRD

```
master_prd_draft
  # 返回撰写提示 — 使用首选模型起草 docs/master-prd.md

master_prd_draft
  content: "<你起草的 PRD 内容>"
  # 写入 docs/master-prd.md，推进到 master_prd_drafting

master_prd_submit
  # 推进到 master_prd_review
```

### 4. 审核并批准 PRD

```
master_prd_review
  approved: true
  summary: "Master PRD 已批准进行功能分解。"
  # 推进到 feature_splitting
```

### 5. 生成并确认功能候选

```
feature_candidates_generate
  candidates:
    - title: "发票收入"
      priority: high
      dependsOn: []
    - title: "付款对账"
      priority: medium
      dependsOn: ["invoice-intake"]

feature_candidates_materialize
  confirmedSlugs: ["invoice-intake", "payment-reconciliation"]
  # 创建 docs/features/feat-invoice-intake/
  #       docs/features/feat-payment-reconciliation/
```

### 6. 审核功能并生成计划

```
feature_review
  featureId: "feat-invoice-intake"
  approved: true

plan_generate
  featureId: "feat-invoice-intake"
  steps:
    - "创建发票收入队列"
    - "添加操作员分配工作流"
  # 写入 docs/features/feat-invoice-intake/05-plan.md
```

### 7. 生成 OpenSpec 并同步

```
openspec_generate
  featureId: "feat-invoice-intake"
  # 写入 openspec/changes/feat-invoice-intake.md

openspec_sync
  featureId: "feat-invoice-intake"
  taskDoneIds: ["INVOICE-INTAKE-1"]
  # 将 OpenSpec 的完成状态应用到 tracker
```

### 8. 检查进度

```
progress_snapshot
  # 返回：
  # Workflow: implementation_ready
  # Features — Total: 2, Done: 1, Pending: 1
  # Tasks — Total: 3, Done: 2, Pending: 1
```

---

## 多功能场景

当多个功能同时进行：

- 每个功能有自己的审核记录、计划和 OpenSpec 制品
- `syncOpenSpecStatus` 只有在其所有任务完成时才标记功能为 `done`
- 工作流只有在**所有**功能完成时才推进到 `completed`
- `progress_snapshot` 显示每个功能的明细并突出显示任何阻塞或需要重新规划的项目

---

## 变更请求

当在规划开始后需要范围变更时：

```
change_request_apply
  title: "调整账单范围"
  request: "需要修订付款对账边界。"
  impactedFeatures: ["feat-payment-reconciliation"]
  # 设置 feat-payment-reconciliation → replan_required
  # 设置工作流 → replan_required
  # 保持 feat-invoice-intake 状态不变
```

解决变更请求，然后在继续之前为受影响的功能重新生成计划。

---

## 运行测试

```bash
bun test            # 运行所有测试
bun run check       # lint + 类型检查 + 测试
bun run build       # 构建 dist/index.js
```

---

## 项目结构

```
src/
  adapters/     OpenSpec 制品生成和任务解析
  agents/       orchestrator 和 reviewer agent 定义
  hooks/        工作流状态验证钩子
  prompts/      审核规则和提示模板
  schemas/      Tracker、功能、审核、配置的 Zod 模式
  store/        所有 .vibe/* 文件的持久化层
  templates/    功能目录和 Master PRD 的文档模板
  tools/        OpenCode 工具定义（每个工具一个文件）
  utils/        常量、fs 帮助器、路径实用程序
  workflows/    核心编排逻辑（撰写、分解、审核、恢复、进度）
tests/
  store/        持久化存储测试
  workflows/    工作流逻辑测试，包括完整的 dogfooding 场景
openspec/
  changes/      此插件自身开发的 OpenSpec 变更制品
```

---

## 相关文档

- [OpenSpec](https://github.com/openspecio/openspec) — 规范驱动开发系统
- [OpenCode](https://opencode.ai) — AI 编码代理平台
- [测试指南](docs/testing.zh-CN.md) — 集成测试流程说明
- [English version](README.md) — 英文版 README
