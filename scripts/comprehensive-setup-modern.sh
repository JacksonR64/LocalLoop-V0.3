#!/usr/bin/env bash
set -euo pipefail

echo "🚀 1000x-App Comprehensive Setup"
echo "================================="
echo ""

# MCP/iTerm compatible prompt function using select menus
ask_yn() {
    local prompt="$1"
    local default="${2:-y}"
    local response
    
    echo -e "$prompt"
    if [[ "$default" == "y" ]]; then
        echo -e "  1) Yes (default)"
        echo -e "  2) No"
    else
        echo -e "  1) Yes"
        echo -e "  2) No (default)"
    fi
    
    while true; do
        read -rp "Enter choice (1/2) or press Enter for default: " response
        case "$response" in
            1|[Yy]|[Yy][Ee][Ss]) 
                echo "✓ Selected: Yes"
                return 0 
                ;;
            2|[Nn]|[Nn][Oo]) 
                echo "✓ Selected: No"
                return 1 
                ;;
            "") 
                if [[ "$default" == "y" ]]; then
                    echo "✓ Using default: Yes"
                    return 0
                else
                    echo "✓ Using default: No"
                    return 1
                fi
                ;;
            *) echo "Please enter 1, 2, or press Enter for default" ;;
        esac
    done
}

SCRIPTS_DIR="$(dirname "$0")"

echo "This comprehensive setup wizard will configure:"
echo "• Next.js project dependencies and basic setup"
echo "• Tailwind CSS 4 with all required packages"
echo "• Environment variables and API keys"
echo "• Memory bank for AI context"
echo "• MCP tools for Cursor IDE"
echo "• GitHub secrets management"
echo ""

# STEP 0: Basic Next.js Project Setup
echo "🏗️ BASIC NEXT.JS PROJECT SETUP"
echo "==============================="

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing Next.js dependencies..."
    if command -v npm >/dev/null 2>&1; then
        npm install
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ npm not found. Please install Node.js and npm first."
        exit 1
    fi
else
    echo "📦 Dependencies already installed"
fi

# Verify package.json exists and has required scripts
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found! This doesn't appear to be a valid Next.js project."
    exit 1
fi

# Install missing Tailwind CSS 4 dependencies
echo "🎨 Installing Tailwind CSS 4 dependencies..."

# Check if @tailwindcss/postcss is installed
if ! npm list @tailwindcss/postcss >/dev/null 2>&1; then
    echo "📦 Installing missing @tailwindcss/postcss..."
    npm install -D @tailwindcss/postcss
    echo "✅ @tailwindcss/postcss installed"
else
    echo "✅ @tailwindcss/postcss already installed"
fi

# Verify other critical packages
echo "🔍 Verifying critical packages..."

missing_packages=()

# Check for essential packages
if ! npm list tailwindcss >/dev/null 2>&1; then
    missing_packages+=("tailwindcss")
fi

if ! npm list postcss >/dev/null 2>&1; then
    missing_packages+=("postcss")
fi

if ! npm list typescript >/dev/null 2>&1; then
    missing_packages+=("typescript")
fi

if ! npm list @types/node >/dev/null 2>&1; then
    missing_packages+=("@types/node")
fi

if ! npm list @types/react >/dev/null 2>&1; then
    missing_packages+=("@types/react")
fi

if ! npm list @types/react-dom >/dev/null 2>&1; then
    missing_packages+=("@types/react-dom")
fi

if [[ ${#missing_packages[@]} -gt 0 ]]; then
    echo "📦 Installing missing packages: ${missing_packages[*]}"
    npm install -D "${missing_packages[@]}"
    echo "✅ Missing packages installed"
fi

# Check if critical Next.js files exist
echo "🔍 Verifying Next.js project structure..."
missing_files=()

if [[ ! -f "next.config.ts" && ! -f "next.config.js" ]]; then
    missing_files+=("next.config.ts/js")
fi

if [[ ! -f "tsconfig.json" ]]; then
    missing_files+=("tsconfig.json")
fi

if [[ ! -d "app" ]]; then
    missing_files+=("app/ directory")
fi

if [[ ! -f "app/layout.tsx" && ! -f "app/layout.js" ]]; then
    missing_files+=("app/layout.tsx")
fi

if [[ ! -f "app/page.tsx" && ! -f "app/page.js" ]]; then
    missing_files+=("app/page.tsx")
fi

if [[ ! -f "postcss.config.mjs" && ! -f "postcss.config.js" ]]; then
    missing_files+=("postcss.config.mjs/js")
fi

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Missing critical Next.js files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "This appears to be an incomplete Next.js project."
    echo "Please ensure you're running this in a complete Next.js project directory."
    exit 1
fi

# Create .env.local if it doesn't exist
if [[ ! -f ".env.local" ]] && [[ -f ".env.example" ]]; then
    echo "📄 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
elif [[ ! -f ".env.local" ]]; then
    echo "📄 Creating basic .env.local..."
    cat > .env.local << 'EOF'
# Next.js Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your API keys and secrets here
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
EOF
    echo "✅ Basic .env.local created"
fi

echo ""
echo "✅ BASIC NEXT.JS SETUP COMPLETE"
echo ""

# STEP 1: Environment Setup
echo "🔧 ENVIRONMENT SETUP"
if ask_yn "Set up environment variables with guided prompts?" "y"; then
    if [[ -f "$SCRIPTS_DIR/env-setup.sh" ]]; then
        echo "🔧 Running environment setup..."
        bash "$SCRIPTS_DIR/env-setup.sh"
    else
        echo "⚠️ env-setup.sh not found"
    fi
else
    echo "⏭️ Skipping environment setup"
fi

echo ""

# STEP 2: Memory Bank Setup  
echo "🧠 MEMORY BANK SETUP"
if ask_yn "Create memory bank with starter context files?" "y"; then
    if [[ -f "$SCRIPTS_DIR/memory-bank.sh" ]]; then
        echo "🔧 Setting up memory bank..."
        bash "$SCRIPTS_DIR/memory-bank.sh"
    else
        echo "⚠️ memory-bank.sh not found"
    fi
else
    echo "⏭️ Skipping memory bank setup"
fi

echo ""

# STEP 3: MCP Tools Setup
echo "🤖 MCP INTEGRATION SETUP"

# TaskMaster-AI  
if ask_yn "Set up TaskMaster-AI MCP for project management?" "y"; then
    if [[ -f "$SCRIPTS_DIR/setup-taskmaster-ai.sh" ]]; then
        echo "🔧 Setting up TaskMaster-AI MCP..."
        bash "$SCRIPTS_DIR/setup-taskmaster-ai.sh"
    else
        echo "⚠️ setup-taskmaster-ai.sh not found"
    fi
else
    echo "⏭️ Skipping TaskMaster-AI MCP setup"
fi

echo ""

# Context7
if ask_yn "Set up Context7 MCP for documentation access?" "y"; then
    if [[ -f "$SCRIPTS_DIR/setup-context7.sh" ]]; then
        echo "🔧 Setting up Context7 MCP..."
        bash "$SCRIPTS_DIR/setup-context7.sh"
    else
        echo "⚠️ setup-context7.sh not found"
    fi
else
    echo "⏭️ Skipping Context7 MCP setup"
fi

echo ""

# Supabase MCP
if ask_yn "Set up Supabase MCP for database operations?" "y"; then
    if [[ -f "$SCRIPTS_DIR/setup-supabase.sh" ]]; then
        echo "🔧 Setting up Supabase MCP..."
        bash "$SCRIPTS_DIR/setup-supabase.sh"
    else
        echo "⚠️ setup-supabase.sh not found"
    fi
else
    echo "⏭️ Skipping Supabase MCP setup"
fi

echo ""

# FINAL VERIFICATION
echo "🧪 FINAL VERIFICATION"
echo "====================="

echo "🔍 Running final project health check..."

# Check if we can import Next.js
if npm list next >/dev/null 2>&1; then
    echo "✅ Next.js dependency verified"
else
    echo "⚠️ Next.js dependency issue detected"
fi

# Check if TypeScript is working
if command -v tsc >/dev/null 2>&1 || npm list typescript >/dev/null 2>&1; then
    echo "✅ TypeScript available"
else
    echo "⚠️ TypeScript not available"
fi

# Check Tailwind CSS 4 setup
if npm list tailwindcss >/dev/null 2>&1 && npm list @tailwindcss/postcss >/dev/null 2>&1; then
    echo "✅ Tailwind CSS 4 setup verified"
else
    echo "⚠️ Tailwind CSS 4 setup issue detected"
fi

# Check PostCSS
if npm list postcss >/dev/null 2>&1; then
    echo "✅ PostCSS available"
else
    echo "⚠️ PostCSS issue detected"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local with your actual API keys"
echo "2. Update memory-bank/ files with your project context"
echo "3. Create scripts/prd.txt with your requirements"
echo "4. Run 'npm run dev' to start developing"
echo ""
echo "🧪 Test your setup:"
echo "   npm run dev"
echo ""
echo "🤖 For AI-powered task management:"
echo "   npm install -g taskmaster-ai"
echo "   taskmaster init"
echo "   taskmaster parse-prd --input=scripts/prd.txt"
echo ""
echo "✅ Your AI-first development environment is ready!"