#!/bin/bash

echo "📚 Setting up Context7 MCP..."

MCP_CONFIG=".cursor/mcp.json"
KEY_NAME="context7"

# Ensure cursor config exists
mkdir -p .cursor
touch "$MCP_CONFIG"

# Check if Context7 is already configured
if grep -q "$KEY_NAME" "$MCP_CONFIG"; then
  echo "🟡 Context7 already present in mcp.json. Skipping setup."
  exit 0
fi

# Inject into mcp.json safely
jq --arg key "$KEY_NAME" '
  .mcpServers += {
    ($key): {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }' "$MCP_CONFIG" > tmp.json && mv tmp.json "$MCP_CONFIG"

echo "✅ Context7 MCP added to .cursor/mcp.json"
