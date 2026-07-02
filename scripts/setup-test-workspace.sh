#!/usr/bin/env bash
#
# setup-test-workspace.sh
#
# Creates a clean, isolated workspace for integration-testing the oc-plugin-prd
# plugin against a real OpenCode session.
#
# Usage:
#   ./scripts/setup-test-workspace.sh [TEST_DIR]
#
# Default TEST_DIR: /tmp/prd-test
#
# What it does:
#   1. Builds the plugin (bun run build)
#   2. Creates the test directory structure
#   3. Symlinks the built plugin into .opencode/plugins/
#   4. Writes minimal .vibe/config.yaml and opencode.json
#   5. Optionally initializes a git repo (needed for OpenSpec tools)
#

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve plugin source root (the directory containing this script's parent)
# ---------------------------------------------------------------------------
PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="${1:-/tmp/prd-test}"

echo "Plugin source : $PLUGIN_ROOT"
echo "Test workspace: $TEST_DIR"
echo ""

# ---------------------------------------------------------------------------
# 0. Check prerequisites
# ---------------------------------------------------------------------------
echo "==> Checking prerequisites..."
command -v bun     >/dev/null 2>&1 || { echo "ERROR: bun not found on PATH. Install from https://bun.sh"; exit 1; }
command -v git     >/dev/null 2>&1 || { echo "ERROR: git not found on PATH."; exit 1; }
command -v opencode >/dev/null 2>&1 || { echo "ERROR: opencode not found on PATH. Install the OpenCode CLI first."; exit 1; }
command -v openspec >/dev/null 2>&1 || echo "WARNING: openspec not found on PATH (required during testing — install with: bun install -g openspec)"
echo ""

# ---------------------------------------------------------------------------
# 1. Build the plugin
# ---------------------------------------------------------------------------
echo "==> Building plugin..."
cd "$PLUGIN_ROOT"
bun run build
echo ""

# ---------------------------------------------------------------------------
# 2. Create / reset test directory
# ---------------------------------------------------------------------------
if [ -d "$TEST_DIR" ]; then
  echo "==> Resetting existing test directory: $TEST_DIR"
  rm -rf "$TEST_DIR"
else
  echo "==> Creating test directory: $TEST_DIR"
fi

mkdir -p "$TEST_DIR/.opencode/plugins"
mkdir -p "$TEST_DIR/.vibe"
echo ""

# ---------------------------------------------------------------------------
# 3. Symlink the built plugin
# ---------------------------------------------------------------------------
echo "==> Symlinking dist/index.js -> $TEST_DIR/.opencode/plugins/index.js"
ln -s "$PLUGIN_ROOT/dist/index.js" "$TEST_DIR/.opencode/plugins/index.js"
echo ""

# ---------------------------------------------------------------------------
# 4. Write .vibe/config.yaml (minimal, required by the plugin)
# ---------------------------------------------------------------------------
echo "==> Writing .vibe/config.yaml"
cat > "$TEST_DIR/.vibe/config.yaml" <<'EOF'
# Minimal workspace config for oc-plugin-prd integration testing.
#
# models: {} falls back to the OpenCode default model for all roles.
# configErrorSeverity: block is the default; set to "warn" if you want
# the plugin to continue with warnings rather than errors on config issues.

models: {}

workflow:
  autoSyncOpenSpec: true
  configErrorSeverity: block
EOF
echo ""

# ---------------------------------------------------------------------------
# 5. Write opencode.json (declares the plugin for this workspace)
# ---------------------------------------------------------------------------
echo "==> Writing opencode.json"
cat > "$TEST_DIR/opencode.json" <<'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [".opencode/plugins/index.js"]
}
EOF
echo ""

# ---------------------------------------------------------------------------
# 6. Initialize git repo (OpenSpec CLI needs a git repo to track changes)
# ---------------------------------------------------------------------------
echo "==> Initializing git repo in $TEST_DIR (required for OpenSpec tools)"
cd "$TEST_DIR"
git init --quiet
git add -A
git commit -m "Initial test workspace" --quiet
echo ""

# ---------------------------------------------------------------------------
# 7. Verify symlink
# ---------------------------------------------------------------------------
echo "==> Verifying setup..."
if [ -L "$TEST_DIR/.opencode/plugins/index.js" ]; then
  TARGET=$(readlink "$TEST_DIR/.opencode/plugins/index.js")
  echo "    symlink OK: -> $TARGET"
else
  echo "    ERROR: symlink not found"
  exit 1
fi

FILE_SIZE=$(wc -c < "$TEST_DIR/.opencode/plugins/index.js")
echo "    plugin size: ${FILE_SIZE} bytes"
echo ""

# ---------------------------------------------------------------------------
# 8. Print summary
# ---------------------------------------------------------------------------
echo "============================================================"
echo "  Test workspace ready: $TEST_DIR"
echo "============================================================"
echo ""
echo "To start testing:"
echo ""
echo "  cd $TEST_DIR"
echo "  opencode"
echo ""
echo "To verify plugin loaded, ask OpenCode:"
echo '  "列出当前可用的所有工具"'
echo ""
echo "To rebuild after source changes:"
echo "  cd $PLUGIN_ROOT && bun run build"
echo "  # symlink is preserved; just restart OpenCode"
echo ""
echo "To clean up:"
echo "  rm -rf $TEST_DIR"
echo ""
