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
#   5. Runs `openspec init` to set up OpenSpec directory structure and OpenCode integration
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
# configErrorSeverity: block ensures tools refuse to run if config is absent.

models: {}

workflow:
  autoSyncOpenSpec: true
  configErrorSeverity: block
EOF
echo ""

# ---------------------------------------------------------------------------
# 5. Write opencode.json (minimal — plugin is auto-discovered from .opencode/plugins/)
# ---------------------------------------------------------------------------
echo "==> Writing opencode.json"
cat > "$TEST_DIR/opencode.json" <<'EOF'
{
  "$schema": "https://opencode.ai/config.json"
}
EOF
echo ""

# ---------------------------------------------------------------------------
# 6. Initialize OpenSpec (creates openspec/ directory structure and OpenCode skills/commands)
# ---------------------------------------------------------------------------
echo "==> Initializing OpenSpec..."
cd "$TEST_DIR"
if command -v openspec &> /dev/null; then
  openspec init --tools opencode
  echo ""
else
  echo "    WARNING: openspec CLI not found in PATH"
  echo "    OpenSpec directory structure will be created on first use by plugin tools"
  echo "    For full OpenSpec integration, install: bun install -g openspec"
  echo ""
fi

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

if [ -d "$TEST_DIR/openspec/changes" ]; then
  echo "    openspec/changes/ OK"
else
  echo "    openspec/changes/ not found (will be created on first use)"
fi
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
