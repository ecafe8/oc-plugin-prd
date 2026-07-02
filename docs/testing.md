# Integration Testing Guide

This guide walks through a complete manual test of the `oc-plugin-prd` plugin
inside a real OpenCode session, using an isolated test workspace that does not
interfere with the plugin source repository.

---

## Prerequisites

- Bun v1.3+
- OpenCode CLI installed and working
- `opencode` binary on PATH
- `openspec` CLI (optional, recommended for full OpenSpec integration)

---

## Quick Start

```bash
# Create and initialize the test workspace
./scripts/setup-test-workspace.sh

# Enter the workspace and start OpenCode
cd /tmp/prd-test
opencode
```

The setup script will:

1. Build the plugin (`bun run build`)
2. Create `/tmp/prd-test` with the correct directory structure
3. Symlink `dist/index.js` into `.opencode/plugins/`
4. Write minimal `.vibe/config.yaml` and `opencode.json`
5. Run `openspec init --tools opencode` to set up OpenSpec directory structure and OpenCode skills/commands

You can pass a custom directory:

```bash
./scripts/setup-test-workspace.sh /path/to/your/test-dir
```

---

## Verify Plugin Is Loaded

After starting OpenCode, send:

> 列出当前可用的所有工具

Expected: the response should include these 19 tools:

```
discovery_capture          discovery_update         discovery_status
project_discover           master_prd_draft         master_prd_generate
master_prd_review          master_prd_submit        feature_candidates_generate
feature_candidates_materialize  feature_split       feature_review
plan_generate              openspec_sync            openspec_generate
progress_snapshot          change_request_apply
review_loop_context        review_loop_execute      switch_model
```

If none of these appear, check:

- `.opencode/plugins/index.js` exists and is a valid symlink
- `bun run build` succeeded with no errors
- Restart OpenCode after rebuilding

---

## Test Flow

This test uses the **billing workspace** scenario from the README:

> Goal: Build a billing workspace that helps finance teams coordinate
> invoice intake and payment reconciliation.

---

### Phase 1 — Discovery

**Input to OpenCode:**

> 我想做一个发票管理工作区，帮助财务团队协调发票收入和对账流程。
> 主要用户：财务经理、账单操作员。
> 约束条件：必须保留审计历史记录。
> 成功标准：发票异常能在1个工作日内解决。

**Expected:**

- `discovery_capture` is called
- `.vibe/discovery/context.yaml` is created
- `.vibe/discovery/summary.md` is created

**Verify:**

```bash
ls .vibe/discovery/
cat .vibe/discovery/context.yaml
```

---

### Phase 2 — Master PRD Authoring

**Step 2a — Request draft:**

> 帮我起草 master PRD

**Expected:**

- `master_prd_draft` is called without `content`
- Returns authoring prompt context
- No file written yet

**Step 2b — Generate and save draft:**

OpenCode should draft content using its model, then call `master_prd_draft`
again with the `content` argument.

**Expected:**

- `docs/master-prd.md` is written
- Workflow advances to `master_prd_drafting`

**Verify:**

```bash
cat docs/master-prd.md
```

**Step 2c — Submit for review:**

> 提交 PRD 审核

**Expected:**

- `master_prd_submit` is called
- Workflow advances to `master_prd_review`

**Step 2d — Approve PRD:**

> 审核通过，PRD 内容完整，可以开始拆分 feature。

**Expected:**

- `master_prd_review` is called with `approved: true`
- `.vibe/reviews/master-prd.yaml` is written
- Workflow advances to `feature_splitting`

---

### Phase 3 — Feature Decomposition

**Input:**

> 把这个 PRD 拆成 2 个 feature：
> 1. 发票收入追踪（高优先级）
> 2. 付款对账异常处理（中优先级，依赖第一个）

**Expected:**

- `feature_candidates_generate` stores candidates in `.vibe/candidates.yaml`
- Candidate list is presented for confirmation
- `feature_candidates_materialize` creates feature directories
- Workflow advances to `feature_splitting`

**Verify:**

```bash
ls docs/features/
# Should see: feat-invoice-tracking/ and feat-payment-reconciliation/

ls docs/features/feat-invoice-tracking/
# Should see: index.md, 01-foundation.md, 02-product.md, 03-ui-ux.md, 04-technical.md, review.yaml
```

---

### Phase 4 — Feature Review and Planning

**Step 4a — Review first feature:**

> 审核第一个 feature（发票收入追踪），审核通过。

**Expected:**

- `feature_review` called with `approved: true`
- Feature status → `awaiting_confirmation`

**Step 4b — Generate implementation plan:**

> 为第一个 feature 生成实现计划：
> 1. 创建发票收入队列
> 2. 添加操作员分配工作流

**Expected:**

- `plan_generate` is called
- `docs/features/feat-invoice-tracking/05-plan.md` is written
- Feature status → `implementation_ready`

**Verify:**

```bash
cat docs/features/feat-invoice-tracking/05-plan.md
```

---

### Phase 5 — OpenSpec Generation

**Step 5a — Generate OpenSpec change:**

> 为第一个 feature 生成 OpenSpec change。

**Expected:**

- `openspec_generate` is called
- `openspec/changes/feat-invoice-tracking.md` is written
- Feature status → `implementation_in_progress`

**Verify:**

```bash
cat openspec/changes/feat-invoice-tracking.md
# Should contain: feature identity, task checklist, traceability section
```

**Step 5b — Rerun OpenSpec generation (test idempotence):**

> 再次为第一个 feature 生成 OpenSpec change。

**Expected:**

- `openspec_generate` returns `isUpdate: true`
- No duplicate file created
- Existing file is updated in place

---

### Phase 6 — OpenSpec Sync

**Step 6a — Sync with completed task:**

> 第一个 task（创建发票收入队列）已完成，同步状态。

**Expected:**

- `openspec_sync` is called with `taskDoneIds: ["INVOICE-TRACKING-1"]`
- Returns `safe_update` outcome
- Tracker task marked done

**Step 6b — Sync again (test no-op):**

> 再次同步第一个 feature 的状态。

**Expected:**

- Returns `no_op` outcome — "tracker and OpenSpec already agree"
- No writes performed

---

### Phase 7 — Progress Tracking

> 查看当前进度。

**Expected:**

- `progress_snapshot` returns structured output showing:
  - Workflow state
  - Feature counts (total, done, active, pending)
  - Task counts (total, done, pending)
  - Any active change requests

---

### Phase 8 — Model Switching

> 把 review 模型切换到 claude-opus-4-5。

**Expected:**

- `switch_model` is called with `role: "review"`, `model: "claude-opus-4-5"`
- `.vibe/config.yaml` is updated
- Output shows the previous and new model names

**Verify:**

```bash
cat .vibe/config.yaml
# models.review.model should be "claude-opus-4-5"
```

> 再次切换回 qwen3.7-plus。

**Expected:**

- `switch_model` updates the config again
- Change takes effect immediately for next tool call

---

## Edge Case Tests

### Rejected Review Recovery

**Setup:** After Phase 4a, instead of approving:

> 审核第一个 feature，不通过，缺少错误处理说明。

**Expected:**

- Feature status → `in_review`
- Workflow → `feature_review`
- Existing documents preserved
- Recovery guidance visible in test output

Verify:

```bash
cat docs/features/feat-invoice-tracking/review.yaml
# decision.status should be "changes_requested"
```

### Plan Generation Guard

**Setup:** After `openspec_generate` marks feature `implementation_in_progress`:

> 重新生成第一个 feature 的实现计划。

**Expected:**

- `plan_generate` is blocked
- Returns: "Feature is already in progress"
- No state mutation

### Change Request and Replan

**Setup:** After planning is done for feature 1:

> 需要调整第二个 feature 的范围，增加历史数据导出功能。

**Expected:**

- `change_request_apply` is called
- Impacted feature → `replan_required`
- Other features unaffected
- Workflow → `replan_required`

---

## File System Verification

After completing the full flow, verify the complete artifact tree:

```bash
find /tmp/prd-test -not -path '*/\.*' -not -path '*/node_modules/*' | sort
```

Expected structure:

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

## Rebuild and Retest Cycle

After modifying plugin source code:

```bash
# In the plugin source directory (where you cloned oc-plugin-prd)
cd <path-to-oc-plugin-prd>
bun run build

# Symlink is preserved; no need to re-setup
# Just restart OpenCode in the test workspace
cd /tmp/prd-test
opencode
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| No PRD tools visible in OpenCode | Plugin not loaded | Check `.opencode/plugins/index.js` symlink; rebuild plugin |
| Config validation error | `.vibe/config.yaml` missing or malformed | Re-run setup script; check YAML syntax |
| `openspec` directory missing | Setup script couldn't find `openspec` CLI | Run `openspec init --tools opencode` manually, or install: `bun install -g openspec` |
| Tools block with "config validation failed" | `configErrorSeverity: block` with bad config | Fix `.vibe/config.yaml` or set severity to `warn` |
| `plan_generate` blocked unexpectedly | Feature is `implementation_in_progress` or `done` | This is expected guard behavior; use `change_request_apply` instead |

---

## Cleanup

```bash
rm -rf /tmp/prd-test
```

---

## Running Unit Tests

Separately from the integration test above, unit tests are run from the
plugin source directory:

```bash
cd <path-to-oc-plugin-prd>

bun test              # run all tests
bun run check         # lint + typecheck + test
bun run build         # rebuild dist/index.js
```
