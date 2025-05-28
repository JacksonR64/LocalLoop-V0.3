#!/bin/bash

echo "🗄️ Setting up Supabase MCP..."

MCP_CONFIG=".cursor/mcp.json"
KEY_NAME="supabase"

# Ensure cursor config exists
mkdir -p .cursor
touch "$MCP_CONFIG"

# Check if Supabase MCP is already configured
if grep -q "$KEY_NAME" "$MCP_CONFIG"; then
  echo "🟡 Supabase MCP already present in mcp.json. Skipping setup."
  exit 0
fi

# Load API key from .env
SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env | cut -d '=' -f2)

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ No SUPABASE_ACCESS_TOKEN found in .env. Cannot continue."
  exit 1
fi

# Inject Supabase MCP config
jq --arg key "$KEY_NAME" --arg token "$SUPABASE_ACCESS_TOKEN" '
  .mcpServers += {
    ($key): {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", $token]
    }
  }' "$MCP_CONFIG" > tmp.json && mv tmp.json "$MCP_CONFIG"

echo "✅ Supabase MCP added to .cursor/mcp.json"
