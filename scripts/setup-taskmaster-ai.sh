#!/bin/bash

echo "🧠 Setting up Taskmaster-AI MCP..."

MCP_CONFIG=".cursor/mcp.json"
KEY_NAME="taskmaster-ai"

# Ensure cursor config exists
mkdir -p .cursor
touch "$MCP_CONFIG"

# Check if Taskmaster-AI is already configured
if grep -q "$KEY_NAME" "$MCP_CONFIG"; then
  echo "🟡 Taskmaster-AI already present in mcp.json. Skipping setup."
  exit 0
fi

# Load API keys from .env
ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY .env | cut -d '=' -f2)

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ No ANTHROPIC_API_KEY found in .env. Cannot continue."
  exit 1
fi

# Inject into mcp.json safely
jq --arg key "$KEY_NAME" --arg anthropic "$ANTHROPIC_API_KEY" '
  .mcpServers += {
    ($key): {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": $anthropic
      }
    }
  }' "$MCP_CONFIG" > tmp.json && mv tmp.json "$MCP_CONFIG"

echo "✅ Taskmaster-AI MCP added to .cursor/mcp.json"
