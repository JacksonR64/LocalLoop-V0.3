#!/usr/bin/env bash
set -euo pipefail

# Define colors for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# Modern y/n prompt function compatible with MCP/iTerm environments
ask_yn() {
    local prompt="$1"
    local default="${2:-y}"
    local response
    
    echo -e "$prompt"
    if [[ "$default" == "y" ]]; then
        echo -e "  ${BLUE}1)${RESET} Yes (default)"
        echo -e "  ${BLUE}2)${RESET} No"
    else
        echo -e "  ${BLUE}1)${RESET} Yes"
        echo -e "  ${BLUE}2)${RESET} No (default)"
    fi
    
    while true; do
        read -rp "Enter your choice (1/2): " response
        case "$response" in
            1|[Yy]|[Yy][Ee][Ss]) return 0 ;;
            2|[Nn]|[Nn][Oo]) return 1 ;;
            "") 
                if [[ "$default" == "y" ]]; then
                    return 0
                else
                    return 1
                fi
                ;;
            *) echo "Please enter 1 or 2" ;;
        esac
    done
}

# API key validation function
validate_api_key() {
    local key="$1"
    local key_type="$2"
    
    # Check for placeholder values
    if [[ "$key" =~ ^(test|key|token|your_|sk-test|placeholder).*$ ]]; then
        echo -e "${RED}⚠️ Detected placeholder value. Please enter a real API key.${RESET}"
        return 1
    fi
    
    # Basic format validation
    case "$key_type" in
        "openai")
            if [[ ! "$key" =~ ^sk- ]]; then
                echo -e "${RED}⚠️ OpenAI API keys should start with 'sk-'${RESET}"
                return 1
            fi
            ;;
        "anthropic")
            if [[ ! "$key" =~ ^sk-ant- ]]; then
                echo -e "${RED}⚠️ Anthropic API keys should start with 'sk-ant-'${RESET}"
                return 1
            fi
            ;;
        "github")
            if [[ -n "$key" && ! "$key" =~ ^(ghp_|github_pat_) ]]; then
                echo -e "${YELLOW}⚠️ GitHub tokens usually start with 'ghp_' (classic) or 'github_pat_' (fine-grained)${RESET}"
            fi
            ;;
    esac
    
    return 0
}

echo -e "${GREEN}🔧 Environment Setup Helper${RESET}"
echo ""

# Setup choice menu
echo -e "${YELLOW}How would you like to set up your environment variables?${RESET}"
echo -e "  ${BLUE}1)${RESET} Guided setup with prompts and direct links (recommended)"
echo -e "  ${BLUE}2)${RESET} Manual setup (use existing .env or edit manually)"

while true; do
    read -rp "Enter your choice (1/2): " user_choice
    case "$user_choice" in
        1) break ;;
        2) break ;;
        *) echo "Please enter 1 or 2" ;;
    esac
done

case "$user_choice" in
  2)
    echo -e "${YELLOW}Manual setup selected.${RESET}"
    echo ""
    
    # Check if .env already exists
    if [[ -f .env ]]; then
      echo -e "${GREEN}✅ Using existing .env file.${RESET}"
    else
      # Check if .env.example exists and create it if needed
      if [[ ! -f .env.example ]]; then
        echo -e "${YELLOW}Creating .env.example template...${RESET}"
        # Create .env.example with proper formatting and reordered by importance
        cat > .env.example << 'EOF'
# AI API Keys (ordered by importance)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Supabase Credentials
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Development & Deployment
GITHUB_TOKEN=
NEXT_PUBLIC_APP_URL=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
EOF
        echo -e "${GREEN}✅ Created .env.example template${RESET}"
      fi
      
      # Create .env from example if it doesn't exist
      echo -e "${YELLOW}No .env file found. Creating from .env.example...${RESET}"
      cp .env.example .env
      echo -e "${GREEN}✅ Created .env from template${RESET}"
    fi
    
    echo ""
    echo -e "${YELLOW}Next steps:${RESET}"
    echo -e "1. Edit the ${CYAN}.env${RESET} file with your preferred text editor"
    echo -e "2. Add the following API keys (ordered by importance):"
    echo ""
    echo -e "${BLUE}🤖 AI API Keys (Required for Claude/TaskMaster):${RESET}"
    echo -e "   • ${CYAN}ANTHROPIC_API_KEY${RESET}: https://console.anthropic.com/settings/keys"
    echo -e "   • ${CYAN}OPENAI_API_KEY${RESET}: https://platform.openai.com/api-keys"
    echo ""
    echo -e "${BLUE}🔗 Supabase Credentials:${RESET}"
    echo -e "   • ${CYAN}SUPABASE_URL${RESET}: https://supabase.com/dashboard/project/_/settings/api"
    echo -e "   • ${CYAN}SUPABASE_ANON_KEY${RESET}: https://supabase.com/dashboard/project/_/settings/api"
    echo -e "   • ${CYAN}SUPABASE_SERVICE_ROLE_KEY${RESET}: https://supabase.com/dashboard/project/_/settings/api (service_role key)"
    echo ""
    echo -e "${BLUE}⚙️ Development & Deployment:${RESET}"
    echo -e "   • ${CYAN}GITHUB_TOKEN${RESET}: https://github.com/settings/tokens"
    echo -e "     ${YELLOW}→ Recommended: Fine-grained Personal Access Token${RESET}"
    echo -e "     ${YELLOW}→ Required permissions: Contents (read/write), Metadata (read)${RESET}"
    echo -e "     ${YELLOW}→ Alternative: Classic PAT with 'repo' scope${RESET}"
    echo -e "   • ${CYAN}NEXT_PUBLIC_APP_URL${RESET}: Your app's public URL (e.g., http://localhost:3000)"
    echo -e "   • ${CYAN}VERCEL_TOKEN${RESET}: https://vercel.com/account/tokens"
    echo -e "   • ${CYAN}VERCEL_ORG_ID${RESET}: https://vercel.com/account"
    echo -e "   • ${CYAN}VERCEL_PROJECT_ID${RESET}: Available in your Vercel project settings"
    echo ""
    
    if ask_yn "${YELLOW}Would you like to upload your secrets to GitHub now?${RESET}"; then
      echo -e "${YELLOW}Proceeding to upload secrets to GitHub...${RESET}"
      # GitHub upload logic would go here
    else
      echo -e "${GREEN}✅ Environment setup complete. You can edit .env manually when ready.${RESET}"
    fi
    ;;
  1)
    echo -e "${YELLOW}Guided setup selected.${RESET}"
    echo ""
    echo -e "${GREEN}✅ Creating .env file with guided prompts${RESET}"
    echo ""
    
    # Create .env file with guided prompts - reordered by importance
    echo "# AI API Keys (ordered by importance)" > .env
    echo -e "${BLUE}=== AI API KEYS (Required for Claude/TaskMaster) ===${RESET}"
    
    # Anthropic API Key (most important for Claude/TaskMaster)
    echo -e "${YELLOW}ANTHROPIC_API_KEY${RESET} - Required for Claude and TaskMaster AI"
    echo -e "→ Get from: ${CYAN}https://console.anthropic.com/settings/keys${RESET}"
    while true; do
        read -rp "Enter ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
        if validate_api_key "$ANTHROPIC_API_KEY" "anthropic"; then
            break
        fi
    done
    echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> .env
    
    # OpenAI API Key
    echo -e "${YELLOW}OPENAI_API_KEY${RESET} - OpenAI API key for GPT models"
    echo -e "→ Get from: ${CYAN}https://platform.openai.com/api-keys${RESET}"
    while true; do
        read -rp "Enter OPENAI_API_KEY: " OPENAI_API_KEY
        if validate_api_key "$OPENAI_API_KEY" "openai"; then
            break
        fi
    done
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
    echo "" >> .env
    
    # Supabase Credentials
    echo "# Supabase Credentials" >> .env
    echo -e "${BLUE}=== SUPABASE CREDENTIALS ===${RESET}"
    echo -e "${YELLOW}SUPABASE_URL${RESET} - Your Supabase project URL"
    echo -e "→ Get from: ${CYAN}https://supabase.com/dashboard/project/_/settings/api${RESET}"
    read -rp "Enter SUPABASE_URL: " SUPABASE_URL
    echo "SUPABASE_URL=$SUPABASE_URL" >> .env
    
    echo -e "${YELLOW}SUPABASE_ANON_KEY${RESET} - Anonymous API key"
    read -rp "Enter SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> .env
    
    echo -e "${YELLOW}SUPABASE_SERVICE_ROLE_KEY${RESET} - Service role key"
    read -rp "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
    echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" >> .env
    echo "" >> .env
    
    # GitHub Token (optional but important)
    echo "# Development & Deployment" >> .env
    echo -e "${BLUE}=== GITHUB TOKEN (Optional but Recommended) ===${RESET}"
    echo -e "${YELLOW}GITHUB_TOKEN${RESET} - GitHub Personal Access Token for repository access"
    echo -e "→ Get from: ${CYAN}https://github.com/settings/tokens${RESET}"
    echo -e "${YELLOW}💡 Recommended: Create a Fine-grained Personal Access Token with:${RESET}"
    echo -e "   • Repository access: Select your specific repository"
    echo -e "   • Permissions: Contents (read/write), Metadata (read)"
    echo -e "${YELLOW}📝 Alternative: Classic PAT with 'repo' scope${RESET}"
    echo -e "${YELLOW}❓ Press Enter to skip for now${RESET}"
    read -rp "Enter GITHUB_TOKEN (optional): " GITHUB_TOKEN
    if [[ -n "$GITHUB_TOKEN" ]]; then
        validate_api_key "$GITHUB_TOKEN" "github"
    fi
    echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> .env
    echo "" >> .env
    
    echo -e "${GREEN}✅ .env file created successfully!${RESET}"
    ;;
esac

echo ""
echo -e "${GREEN}✅ Environment setup complete!${RESET}"
echo -e "${CYAN}💡 TIP: Edit .env with your actual API keys when ready${RESET}"