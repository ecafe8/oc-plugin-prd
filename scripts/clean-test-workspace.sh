#!/usr/bin/env bash
#
# clean-test-workspace.sh
#
# Resets generated PRD/OpenSpec state in an integration-test workspace while
# preserving OpenCode configuration, provider configuration, plugin symlink,
# OpenSpec commands/skills, and .vibe/config.yaml.
#
# Usage:
#   ./scripts/clean-test-workspace.sh [TEST_DIR]
#
# Default TEST_DIR: /tmp/prd-test

set -euo pipefail

TEST_DIR="${1:-/tmp/prd-test}"

if [ "$TEST_DIR" = "-h" ] || [ "$TEST_DIR" = "--help" ]; then
  sed -n '2,14p' "$0"
  exit 0
fi

if [ ! -d "$TEST_DIR" ]; then
  echo "Test workspace does not exist: $TEST_DIR"
  exit 1
fi

echo "Cleaning generated state in: $TEST_DIR"

# Generated PRD artifacts.
rm -rf "$TEST_DIR/docs"

# Generated workspace state. Keep .vibe/config.yaml so provider/model choices
# survive a reset; remove all runtime and workflow artifacts around it.
rm -rf \
  "$TEST_DIR/.vibe/tracker.yaml" \
  "$TEST_DIR/.vibe/candidates.yaml" \
  "$TEST_DIR/.vibe/discovery" \
  "$TEST_DIR/.vibe/reviews" \
  "$TEST_DIR/.vibe/changes" \
  "$TEST_DIR/.vibe/sessions"

# Generated OpenSpec project artifacts. Keep the OpenSpec installation,
# commands, skills, and plugin files under .opencode/.
rm -rf \
  "$TEST_DIR/openspec/changes" \
  "$TEST_DIR/openspec/specs"

mkdir -p "$TEST_DIR/.vibe" "$TEST_DIR/openspec/changes" "$TEST_DIR/openspec/specs"

if [ ! -f "$TEST_DIR/.vibe/config.yaml" ]; then
  cat > "$TEST_DIR/.vibe/config.yaml" <<'EOF'
models: {}

workflow:
  autoSyncOpenSpec: true
  configErrorSeverity: block
EOF
  echo "Created missing .vibe/config.yaml"
else
  echo "Preserved .vibe/config.yaml"
fi

echo ""
echo "Clean workspace ready: $TEST_DIR"
echo "Preserved:"
echo "  - opencode.json / opencode.jsonc"
echo "  - .opencode/plugins, .opencode/skills, .opencode/commands"
echo "  - .vibe/config.yaml"
echo "Removed:"
echo "  - docs/"
echo "  - .vibe/tracker.yaml, discovery/, reviews/, sessions/, candidates.yaml"
echo "  - openspec/changes/ and openspec/specs/"
echo ""
echo "Restart OpenCode before starting a new test session."
