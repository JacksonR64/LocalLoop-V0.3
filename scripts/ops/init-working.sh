#!/bin/bash

# Alternative approach using select menu instead of read commands

SCRIPTS_DIR="$(dirname "$0")"

echo ""
echo "🚀 Welcome to the 1000x-app setup wizard!"
echo "This script will help you configure your environment, secrets, and memory bank."
echo ""

# Function to ask yes/no using select
ask_yes_no() {
    local question="$1"
    echo "$question"
    select yn in "Yes" "No"; do
        case $yn in
            Yes ) return 0;;
            No ) return 1;;
            * ) echo "Please select 1 for Yes or 2 for No.";;
        esac
    done
}

### STEP 1: Environment File Setup ###
echo "🔐 ENVIRONMENT SETUP"
if ask_yes_no "Run environment setup scripts?"; then
    echo "🔧 Running environment setup..."
    [[ -f "$SCRIPTS_DIR/env-setup.sh" ]] && bash "$SCRIPTS_DIR/env-setup.sh" || echo "⚠️ env-setup.sh not found"
    [[ -f "$SCRIPTS_DIR/initialize-env.sh" ]] && bash "$SCRIPTS_DIR/initialize-env.sh" || echo "⚠️ initialize-env.sh not found"
else
    echo "⏭️ Skipping environment setup."
fi

echo ""
### STEP 2: Secrets ###
echo "🔐 PUSHING SECRETS"
if ask_yes_no "Push secrets now?"; then
    if [[ -f "$SCRIPTS_DIR/push-secrets.sh" ]]; then
        echo "🔧 Pushing secrets..."
        bash "$SCRIPTS_DIR/push-secrets.sh"
    else
        echo "⚠️ push-secrets.sh not found"
    fi
else
    echo "⏭️ Skipping secrets push."
fi

echo ""
### STEP 3: Memory Bank ###
echo "🧠 MEMORY BANK SETUP"
if ask_yes_no "Create memory-bank folder with starter .md files?"; then
    if [[ -f "$SCRIPTS_DIR/memory-bank.sh" ]]; then
        echo "🔧 Setting up memory bank..."
        bash "$SCRIPTS_DIR/memory-bank.sh"
    else
        echo "⚠️ memory-bank.sh not found"
    fi
else
    echo "⏭️ Skipping memory bank setup."
fi

echo ""
### STEP 4: MCP Tools ###
echo "🤖 MCP INTEGRATION SETUP"

# Taskmaster-AI
if ask_yes_no "Set up Taskmaster-AI MCP?"; then
    if [[ -f "$SCRIPTS_DIR/setup-taskmaster-ai.sh" ]]; then
        echo "🔧 Setting up Taskmaster-AI MCP..."
        bash "$SCRIPTS_DIR/setup-taskmaster-ai.sh"
    else
        echo "⚠️ setup-taskmaster-ai.sh not found"
    fi
else
    echo "⏭️ Skipping Taskmaster-AI MCP setup."
fi

echo ""
# Context7
if ask_yes_no "Set up Context7 MCP?"; then
    if [[ -f "$SCRIPTS_DIR/setup-context7.sh" ]]; then
        echo "🔧 Setting up Context7 MCP..."
        bash "$SCRIPTS_DIR/setup-context7.sh"
    else
        echo "⚠️ setup-context7.sh not found"
    fi
else
    echo "⏭️ Skipping Context7 MCP setup."
fi

echo ""
# Supabase MCP
if ask_yes_no "Set up Supabase MCP?"; then
    if [[ -f "$SCRIPTS_DIR/setup-supabase.sh" ]]; then
        echo "🔧 Setting up Supabase MCP..."
        bash "$SCRIPTS_DIR/setup-supabase.sh"
    else
        echo "⚠️ setup-supabase.sh not found"
    fi
else
    echo "⏭️ Skipping Supabase MCP setup."
fi

echo ""
echo "✅ Setup finished! You're now ready to build with the AI-first 1000x-app workflow."
echo ""