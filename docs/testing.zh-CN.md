# 集成测试指南

本指南将引导你在真实的 OpenCode 会话中，对 `oc-plugin-prd` 插件进行一次完整的手动测试。测试在独立的测试工作区中进行，不会干扰插件源码仓库。

---

## 前置条件

- Bun v1.3+
- 已安装并正常运行的 OpenCode CLI
- `opencode` 命令已加入 PATH
- `openspec` CLI（可选，但推荐用于完整 OpenSpec 集成）

---

## 快速开始

```bash
# 创建并初始化测试工作区
./scripts/setup-test-workspace.sh

# 进入工作区并启动 OpenCode
cd /tmp/prd-test
opencode
```

初始化脚本会依次：

1. 构建插件（`bun run build`）
2. 创建 `/tmp/prd-test` 及所需目录结构
3. 将 `dist/index.js` 通过 symlink 链接到 `.opencode/plugins/`
4. 写入最小化的 `.vibe/config.yaml` 和 `opencode.json`
5. 运行 `openspec init --tools opencode` 初始化 OpenSpec 目录结构和 OpenCode skills/commands

支持自定义测试目录：

```bash
./scripts/setup-test-workspace.sh /path/to/your/test-dir
```

---

## 验证插件已加载

启动 OpenCode 后，发送：

> 列出当前可用的所有工具

预期返回应包含以下 19 个工具：

```
discovery_capture          discovery_update         discovery_status
project_discover           master_prd_draft         master_prd_generate
master_prd_review          master_prd_submit        feature_candidates_generate
feature_candidates_materialize  feature_split       feature_review
plan_generate              openspec_sync            openspec_generate
progress_snapshot          change_request_apply
review_loop_context        review_loop_execute
```

如果未出现以上工具，请检查：

- `.opencode/plugins/index.js` 是否存在且为有效 symlink
- `bun run build` 是否构建成功且无报错
- 重新构建后需重启 OpenCode

---

## 测试流程

本测试使用 README 中的**发票管理工作区**场景：

> 目标：构建一个帮助财务团队协调发票收入和对账流程的工作区。

---

### 阶段 1 — 发现（Discovery）

**输入：**

> 我想做一个发票管理工作区，帮助财务团队协调发票收入和对账流程。
> 主要用户：财务经理、账单操作员。
> 约束条件：必须保留审计历史记录。
> 成功标准：发票异常能在1个工作日内解决。

**预期行为：**

- 调用 `discovery_capture`
- 创建 `.vibe/discovery/context.yaml`
- 创建 `.vibe/discovery/summary.md`

**验证：**

```bash
ls .vibe/discovery/
cat .vibe/discovery/context.yaml
```

---

### 阶段 2 — Master PRD 撰写

**步骤 2a — 请求起草：**

> 帮我起草 master PRD

**预期行为：**

- 调用 `master_prd_draft`（不带 `content` 参数）
- 返回 authoring prompt 上下文
- 此时尚未写入文件

**步骤 2b — 生成并保存草稿：**

OpenCode 使用模型生成内容后，会再次调用 `master_prd_draft` 并传入 `content` 参数。

**预期行为：**

- 写入 `docs/master-prd.md`
- 工作流推进到 `master_prd_drafting`

**验证：**

```bash
cat docs/master-prd.md
```

**步骤 2c — 提交审核：**

> 提交 PRD 审核

**预期行为：**

- 调用 `master_prd_submit`
- 工作流推进到 `master_prd_review`

**步骤 2d — 审核通过：**

> 审核通过，PRD 内容完整，可以开始拆分 feature。

**预期行为：**

- 调用 `master_prd_review`，`approved: true`
- 写入 `.vibe/reviews/master-prd.yaml`
- 工作流推进到 `feature_splitting`

---

### 阶段 3 — Feature 分解

**输入：**

> 把这个 PRD 拆成 2 个 feature：
> 1. 发票收入追踪（高优先级）
> 2. 付款对账异常处理（中优先级，依赖第一个）

**预期行为：**

- `feature_candidates_generate` 将候选存入 `.vibe/candidates.yaml`
- 展示候选列表等待确认
- `feature_candidates_materialize` 创建 feature 目录
- 工作流推进到 `feature_splitting`

**验证：**

```bash
ls docs/features/
# 应看到：feat-invoice-tracking/ 和 feat-payment-reconciliation/

ls docs/features/feat-invoice-tracking/
# 应看到：index.md, 01-foundation.md, 02-product.md, 03-ui-ux.md, 04-technical.md, review.yaml
```

---

### 阶段 4 — Feature 审核与计划

**步骤 4a — 审核第一个 feature：**

> 审核第一个 feature（发票收入追踪），审核通过。

**预期行为：**

- 调用 `feature_review`，`approved: true`
- Feature 状态 → `awaiting_confirmation`

**步骤 4b — 生成实现计划：**

> 为第一个 feature 生成实现计划：
> 1. 创建发票收入队列
> 2. 添加操作员分配工作流

**预期行为：**

- 调用 `plan_generate`
- 写入 `docs/features/feat-invoice-tracking/05-plan.md`
- Feature 状态 → `implementation_ready`

**验证：**

```bash
cat docs/features/feat-invoice-tracking/05-plan.md
```

---

### 阶段 5 — OpenSpec 生成

**步骤 5a — 生成 OpenSpec change：**

> 为第一个 feature 生成 OpenSpec change。

**预期行为：**

- 调用 `openspec_generate`
- 写入 `openspec/changes/feat-invoice-tracking.md`
- Feature 状态 → `implementation_in_progress`

**验证：**

```bash
cat openspec/changes/feat-invoice-tracking.md
# 应包含：feature 标识、任务清单、溯源章节
```

**步骤 5b — 重新生成（测试幂等性）：**

> 再次为第一个 feature 生成 OpenSpec change。

**预期行为：**

- `openspec_generate` 返回 `isUpdate: true`
- 不创建重复文件
- 原地更新已有文件

---

### 阶段 6 — OpenSpec 同步

**步骤 6a — 同步已完成任务：**

> 第一个 task（创建发票收入队列）已完成，同步状态。

**预期行为：**

- 调用 `openspec_sync`，传入 `taskDoneIds: ["INVOICE-TRACKING-1"]`
- 返回 `safe_update` 结果
- Tracker 中对应 task 标记为 done

**步骤 6b — 再次同步（测试 no-op）：**

> 再次同步第一个 feature 的状态。

**预期行为：**

- 返回 `no_op` 结果 — "tracker and OpenSpec already agree"
- 无任何写入操作

---

### 阶段 7 — 进度追踪

> 查看当前进度。

**预期行为：**

- `progress_snapshot` 返回结构化输出，包含：
  - 工作流状态
  - Feature 统计（总数、已完成、进行中、待处理）
  - Task 统计（总数、已完成、待处理）
  - 活跃的变更请求

---

## 边界场景测试

### 审核驳回恢复

**设置：** 在阶段 4a 时，不通过审核：

> 审核第一个 feature，不通过，缺少错误处理说明。

**预期行为：**

- Feature 状态 → `in_review`
- 工作流 → `feature_review`
- 已有文档保留不变
- 输出中包含恢复引导

验证：

```bash
cat docs/features/feat-invoice-tracking/review.yaml
# decision.status 应为 "changes_requested"
```

### 计划生成保护

**设置：** 在 `openspec_generate` 将 feature 标记为 `implementation_in_progress` 后：

> 重新生成第一个 feature 的实现计划。

**预期行为：**

- `plan_generate` 被阻止
- 返回："Feature is already in progress"
- 状态无变化

### 变更请求与重新规划

**设置：** 第一个 feature 计划完成后：

> 需要调整第二个 feature 的范围，增加历史数据导出功能。

**预期行为：**

- 调用 `change_request_apply`
- 受影响的 feature → `replan_required`
- 其他 feature 不受影响
- 工作流 → `replan_required`

---

## 文件系统验证

完成完整流程后，验证所有产物：

```bash
find /tmp/prd-test -not -path '*/\.*' -not -path '*/node_modules/*' | sort
```

预期目录结构：

```
/tmp/prd-test
├── docs/
│   ├── master-prd.md
│   └── features/
│       └── feat-invoice-tracking/
│           ├── index.md
│           ├── 01-foundation.md
│           ├── 02-product.md
│           ├── 03-ui-ux.md
│           ├── 04-technical.md
│           ├── 05-plan.md
│           └── review.yaml
├── openspec/
│   └── changes/
│       └── feat-invoice-tracking.md
└── .vibe/
    ├── config.yaml
    ├── tracker.yaml
    ├── candidates.yaml
    ├── discovery/
    │   ├── context.yaml
    │   ├── summary.md
    │   └── questions.md
    └── reviews/
        └── master-prd.yaml
```

---

## 重新构建与重测

修改插件源码后：

```bash
# 在插件源码目录（oc-plugin-prd 的克隆目录）
cd <path-to-oc-plugin-prd>
bun run build

# symlink 保持不变，无需重新 setup
# 在测试工作区重启 OpenCode 即可
cd /tmp/prd-test
opencode
```

---

## 问题排查

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| OpenCode 中看不到 PRD 工具 | 插件未加载 | 检查 `.opencode/plugins/index.js` symlink；重新构建插件 |
| 配置验证错误 | `.vibe/config.yaml` 缺失或格式错误 | 重新运行 setup 脚本；检查 YAML 语法 |
| `openspec` 目录缺失 | setup 脚本未找到 `openspec` CLI | 手动运行 `openspec init --tools opencode`，或安装：`bun install -g openspec` |
| 工具报 "config validation failed" 并阻塞 | `configErrorSeverity: block` 且配置有问题 | 修复 `.vibe/config.yaml` 或将 severity 设为 `warn` |
| `plan_generate` 意外被阻止 | Feature 已处于 `implementation_in_progress` 或 `done` 状态 | 这是预期的保护行为；应使用 `change_request_apply` 处理范围变更 |

---

## 清理

```bash
rm -rf /tmp/prd-test
```

---

## 运行单元测试

与上述集成测试独立，在插件源码目录运行单元测试：

```bash
cd <path-to-oc-plugin-prd>

bun test              # 运行所有测试
bun run check         # lint + 类型检查 + 测试
bun run build         # 重新构建 dist/index.js
```
