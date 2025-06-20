#!/bin/bash

# Quick Diff Analysis - Simplified version of focused diff generator
# Usage: ./scripts/quick-diff.sh [source_branch] [target_branch]

SOURCE_BRANCH="${1:-main}"
TARGET_BRANCH="${2:-$(git branch --show-current)}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Quick Diff Analysis: $SOURCE_BRANCH → $TARGET_BRANCH${NC}"
echo "========================================================"

echo -e "\n${YELLOW}📈 Summary Stats:${NC}"
echo "Files changed: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ')"
echo "Commits ahead: $(git rev-list --count $SOURCE_BRANCH..$TARGET_BRANCH 2>/dev/null || echo "0")"
git diff $SOURCE_BRANCH..$TARGET_BRANCH --shortstat

echo -e "\n${YELLOW}🔑 Key Files Changed:${NC}"
git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | \
    grep -E '\.(json|js|ts|astro|config|md)$' | \
    grep -v node_modules | \
    head -10

echo -e "\n${YELLOW}📁 File Types:${NC}"
git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | \
    sed 's/.*\.//' | \
    sort | uniq -c | sort -nr | \
    head -8

echo -e "\n${YELLOW}➕ New Files (Top 10):${NC}"
git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | \
    grep '^A' | \
    grep -v -E '\.(jpg|png|gif|woff|lock)$' | \
    head -10

echo -e "\n${GREEN}✨ Generate detailed analysis:${NC}"
echo "./scripts/generate-focused-diff.sh $SOURCE_BRANCH $TARGET_BRANCH" 