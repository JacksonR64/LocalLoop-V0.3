#!/bin/bash

# memory-bank.sh — Sets up the memory-bank folder with templated Markdown files

MEMORY_DIR="memory-bank"

echo "📦 Setting up Memory Bank directory with starter files..."

mkdir -p "$MEMORY_DIR"

echo "📝 Creating memory bank files..."

# Create projectbrief.md
cat > "$MEMORY_DIR/projectbrief.md" << 'EOF'
# 📘 Project Brief

## 🎯 Mission
Describe what this project does, what problem it solves, and who it's for.

## ✅ Success Criteria
- ...
- ...

## 🚫 Out of Scope
List what the project does NOT cover.
EOF
echo "✅ Created $MEMORY_DIR/projectbrief.md"

# Create productContext.md
cat > "$MEMORY_DIR/productContext.md" << 'EOF'
# 🎯 Product Context

## 👤 Target Users
Who are we building this for?

## 💥 Pain Points
What problems do they face?

## 🌟 UX Goals
What should their ideal experience look like?
EOF
echo "✅ Created $MEMORY_DIR/productContext.md"

# Create techContext.md
cat > "$MEMORY_DIR/techContext.md" << 'EOF'
# ⚙️ Tech Context

## 🔧 Tech Stack
- Frontend:
- Backend:
- Database:

## 📦 Dependencies
List versions or libraries in use.
EOF
echo "✅ Created $MEMORY_DIR/techContext.md"

# Create activeContext.md
cat > "$MEMORY_DIR/activeContext.md" << 'EOF'
# 🚧 Active Context

## 🔄 Current Focus
What are we actively working on?

## 🧱 Work In Progress
- [ ] Feature: 
- [ ] Bug: 

## 🚫 Blockers
List known blockers or issues.
EOF
echo "✅ Created $MEMORY_DIR/activeContext.md"

# Create progress.md
cat > "$MEMORY_DIR/progress.md" << 'EOF'
# 📈 Progress Log

Use this as a rolling dev journal.

## 🗓️ Date - Update
- Summary of changes or discussion.
EOF
echo "✅ Created $MEMORY_DIR/progress.md"

# Create scratchpad.md
cat > "$MEMORY_DIR/scratchpad.md" << 'EOF'
# ✍️ Scratchpad

Use this file for ideas, snippets, or experimental prompts.

## 🧪 Test ideas:
- ...

## 💡 Brainstorm:
- ...
EOF
echo "✅ Created $MEMORY_DIR/scratchpad.md"

echo ""
echo "✅ Memory Bank setup complete. AI can now use this persistent context across sessions."