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
#   4. Prompts for model selection (drafting/review)
#   5. Writes .vibe/config.yaml and opencode.json
#   6. Runs `openspec init` to set up OpenSpec directory structure and OpenCode integration
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
# 4. Interactive model selection
# ---------------------------------------------------------------------------
echo "==> Model configuration"
echo ""
echo "    Available model roles:"
echo "      - drafting: used for PRD and feature document authoring"
echo "      - review:   used for structured review critique"
echo ""
echo "    Leave blank to use OpenCode default model."
echo "    You can change models later with the switch_model tool in OpenCode."
echo ""

DRAFTING_MODEL=""
REVIEW_MODEL=""

# Check if running interactively
if [ -t 0 ]; then
  read -r -p "    Drafting model (e.g. claude-opus-4-5): " DRAFTING_MODEL
  read -r -p "    Review model (e.g. claude-sonnet-4-5): " REVIEW_MODEL
else
  echo "    (non-interactive mode, using default models)"
fi

# Build config.yaml
CONFIG_CONTENT="# Workspace config for oc-plugin-prd integration testing.
#
# configErrorSeverity: block ensures tools refuse to run if config is absent.

models:"

if [ -n "$DRAFTING_MODEL" ]; then
  CONFIG_CONTENT="$CONFIG_CONTENT
  drafting:
    model: $DRAFTING_MODEL"
fi

if [ -n "$REVIEW_MODEL" ]; then
  CONFIG_CONTENT="$CONFIG_CONTENT
  review:
    model: $REVIEW_MODEL"
fi

if [ -z "$DRAFTING_MODEL" ] && [ -z "$REVIEW_MODEL" ]; then
  CONFIG_CONTENT="$CONFIG_CONTENT {}"
fi

CONFIG_CONTENT="$CONFIG_CONTENT

workflow:
  autoSyncOpenSpec: true
  configErrorSeverity: block
"

echo ""
echo "==> Writing .vibe/config.yaml"
echo "$CONFIG_CONTENT" > "$TEST_DIR/.vibe/config.yaml"

# Show what was written
if [ -n "$DRAFTING_MODEL" ]; then
  echo "    drafting: $DRAFTING_MODEL"
else
  echo "    drafting: (OpenCode default)"
fi
if [ -n "$REVIEW_MODEL" ]; then
  echo "    review:   $REVIEW_MODEL"
else
  echo "    review:   (OpenCode default)"
fi
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
echo "To switch models during a session:"
echo '  "把 review 模型切换到 claude-opus-4-5"'
echo "  (uses the switch_model tool, takes effect immediately)"
echo ""
echo "To rebuild after source changes:"
echo "  cd $PLUGIN_ROOT && bun run build"
echo "  # symlink is preserved; just restart OpenCode"
echo ""
echo "To clean up:"
echo "  rm -rf $TEST_DIR"
echo ""
