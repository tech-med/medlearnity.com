# Generating Migration Diff Analysis

**Purpose**: Generate comprehensive analysis of changes between migration phases for review, documentation, and team collaboration.

## Quick Reference

| Use Case                    | Script                               | Output                               |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| **PR Review**               | `./scripts/quick-diff.sh`            | Fast overview with key stats         |
| **Milestone Documentation** | `./scripts/generate-focused-diff.sh` | Comprehensive analysis (~100k words) |
| **Debug/Troubleshoot**      | `./scripts/quick-diff.sh`            | Quick insights into changes          |

---

## Quick Commands

### Enhanced Focused Diff Scripts

**Quick Overview Analysis** (fast, essential stats):

```bash
# Quick diff analysis - immediate insights
./scripts/quick-diff.sh [source_branch] [target_branch]

# Examples
./scripts/quick-diff.sh                    # main → current branch
./scripts/quick-diff.sh main feature-branch
./scripts/quick-diff.sh main wordpress-content-migration
```

**Comprehensive Enhanced Analysis** (detailed, ~100k words):

```bash
# Enhanced focused diff - comprehensive analysis
./scripts/generate-focused-diff.sh [source_branch] [target_branch] [output_dir]

# Examples
./scripts/generate-focused-diff.sh                    # main → current, docs/analysis/
./scripts/generate-focused-diff.sh main wordpress-content-migration
./scripts/generate-focused-diff.sh main feature-branch docs/analysis/

# View generated analysis
ls -la docs/analysis/enhanced-diff-analysis-*.md
```

### Legacy Manual Analysis (if scripts unavailable)

```bash
# Create temporary analysis directory
mkdir -p /tmp/migration-analysis-$(date +%Y%m%d)

# Generate basic analysis file
ANALYSIS_DIR="/tmp/migration-analysis-$(date +%Y%m%d)"
ANALYSIS_FILE="$ANALYSIS_DIR/migration-analysis.md"

# Create analysis with header
cat > "$ANALYSIS_FILE" << 'EOF'
# Migration Analysis Report
**Generated**: $(date)
**Repository**: $(git remote get-url origin)
**Comparison**: main → $(git branch --show-current)

---

## File Changes Summary
EOF

# Add git statistics
echo -e "\n## Git Statistics\n\`\`\`" >> "$ANALYSIS_FILE"
git diff main..$(git branch --show-current) --stat >> "$ANALYSIS_FILE"
echo -e "\`\`\`\n" >> "$ANALYSIS_FILE"

# Add files changed list
echo -e "## Files Changed\n\`\`\`" >> "$ANALYSIS_FILE"
git diff main..$(git branch --show-current) --name-status >> "$ANALYSIS_FILE"
echo -e "\`\`\`\n" >> "$ANALYSIS_FILE"

echo "Analysis generated: $ANALYSIS_FILE"
```

### Individual Analysis Components

```bash
# 1. File change statistics
git diff main..astro-migration --stat

# 2. Files added/modified/deleted
git diff main..astro-migration --name-status

# 3. Full diff patch (large file)
git diff main..astro-migration > full-changes.patch

# 4. Specific file diff
git diff main..astro-migration package.json

# 5. Directory-specific changes
git diff main..astro-migration src/
```

---

## Complete Analysis Workflow

### Step 1: Setup Analysis Environment

```bash
# Create timestamped analysis directory
TIMESTAMP=$(date +%Y%m%d-%H%M)
ANALYSIS_DIR="/tmp/migration-analysis-$TIMESTAMP"
mkdir -p "$ANALYSIS_DIR"
cd "$ANALYSIS_DIR"

# Set variables
SOURCE_BRANCH="main"
TARGET_BRANCH=$(git -C /path/to/project branch --show-current)
PROJECT_DIR="/path/to/project"
```

### Step 2: Generate Analysis Components

```bash
# Navigate to project
cd "$PROJECT_DIR"

# Basic statistics
git diff $SOURCE_BRANCH..$TARGET_BRANCH --stat > "$ANALYSIS_DIR/git-stats.txt"

# File changes
git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status > "$ANALYSIS_DIR/files-changed.txt"

# Full diff (warning: can be very large)
git diff $SOURCE_BRANCH..$TARGET_BRANCH > "$ANALYSIS_DIR/full-diff.patch"

# Key configuration files
git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json > "$ANALYSIS_DIR/package-json.diff"
git diff $SOURCE_BRANCH..$TARGET_BRANCH astro.config.mjs > "$ANALYSIS_DIR/astro-config.diff"
git diff $SOURCE_BRANCH..$TARGET_BRANCH tsconfig.json > "$ANALYSIS_DIR/typescript-config.diff"
```

### Step 3: Create Comprehensive Report

```bash
# Generate structured analysis report
cat > "$ANALYSIS_DIR/comprehensive-analysis.md" << EOF
# Migration Analysis Report
**Generated**: $(date)
**Project**: $(basename $(git remote get-url origin) .git)
**Repository**: $(git remote get-url origin)
**Comparison**: $SOURCE_BRANCH → $TARGET_BRANCH
**Analyst**: $(git config user.name)

---

## Executive Summary

### Key Changes
- Total files changed: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | wc -l)
- Lines added: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --stat | tail -1 | grep -o '[0-9]* insertion' | cut -d' ' -f1)
- Lines deleted: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --stat | tail -1 | grep -o '[0-9]* deletion' | cut -d' ' -f1)
- Binary files: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | grep -c '^A.*\.(jpg\|png\|gif\|woff\|woff2\|pdf\)$')

### Branch Information
- **Source Branch**: $SOURCE_BRANCH
- **Target Branch**: $TARGET_BRANCH
- **Commits ahead**: $(git rev-list --count $SOURCE_BRANCH..$TARGET_BRANCH)

---

## Detailed Statistics

\`\`\`
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --stat)
\`\`\`

## Files Changed

\`\`\`
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status)
\`\`\`

---

## Key Configuration Changes

### Package.json
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | head -50)

### Astro Configuration
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH astro.config.mjs | head -30)

---

## Analysis Files Generated
- \`git-stats.txt\` - Statistical summary
- \`files-changed.txt\` - List of all changed files
- \`full-diff.patch\` - Complete diff (apply with \`git apply\`)
- \`package-json.diff\` - Package.json changes
- \`astro-config.diff\` - Astro configuration changes
- \`comprehensive-analysis.md\` - This report

---

*Generated on $(date) by $(git config user.name)*
EOF
```

### Step 4: Review and Export

```bash
# View the analysis
echo "Analysis complete! Files generated in: $ANALYSIS_DIR"
ls -la "$ANALYSIS_DIR"

# Optional: Copy analysis to project docs
cp "$ANALYSIS_DIR/comprehensive-analysis.md" "$PROJECT_DIR/docs/migration-analysis-$(date +%Y%m%d).md"

# Clean up (optional)
# rm -rf "$ANALYSIS_DIR"
```

---

## Analysis Templates

### Quick Stats Template

```bash
#!/bin/bash
# quick-migration-stats.sh

BRANCH1=${1:-main}
BRANCH2=${2:-$(git branch --show-current)}

echo "=== Migration Analysis: $BRANCH1 → $BRANCH2 ==="
echo "Files changed: $(git diff $BRANCH1..$BRANCH2 --name-status | wc -l)"
echo "Total changes: $(git diff $BRANCH1..$BRANCH2 --stat | tail -1)"
echo "Commits: $(git rev-list --count $BRANCH1..$BRANCH2)"
echo ""
echo "=== File Types ==="
git diff $BRANCH1..$BRANCH2 --name-status | cut -f2 | sed 's/.*\.//' | sort | uniq -c | sort -nr
```

### Pre-PR Analysis Template

```bash
#!/bin/bash
# pre-pr-analysis.sh

echo "🔍 Pre-PR Analysis for $(git branch --show-current)"
echo "Repository: $(git remote get-url origin)"
echo "Time: $(date)"
echo ""

# Ensure we're comparing against latest main
git fetch origin main

echo "📊 Statistics:"
git diff origin/main..HEAD --stat

echo ""
echo "📁 Files changed:"
git diff origin/main..HEAD --name-status

echo ""
echo "🔍 Key files to review:"
git diff origin/main..HEAD --name-only | grep -E '\.(json|js|ts|astro|md)$' | head -10

echo ""
echo "⚠️  Binary files added:"
git diff origin/main..HEAD --name-status | grep -E '\.(jpg|png|gif|woff|woff2|pdf)$'

echo ""
echo "🚀 Ready for PR creation!"
```

---

## Best Practices

### When to Generate Analysis

- **Before creating pull requests** - Use `./scripts/quick-diff.sh` for PR overview
- **Phase completions** - Use `./scripts/generate-focused-diff.sh` for milestone documentation
- **Code reviews** - Quick analysis to understand impact of changes
- **Debugging** - Track down when changes were introduced
- **Documentation** - Create comprehensive migration records with enhanced analysis

### What to Include

- **Executive summary** with key metrics
- **File change statistics**
- **Configuration file diffs** (package.json, astro.config.mjs, etc.)
- **Binary file inventory** (images, fonts, etc.)
- **Commit history** between branches

### Analysis Storage

```bash
# Project documentation (permanent)
docs/
├── migration-analysis-YYYYMMDD.md
├── phase-1-analysis.md
└── pre-deployment-analysis.md

# Temporary analysis (cleanup after review)
/tmp/migration-analysis-YYYYMMDD-HHMM/
├── comprehensive-analysis.md
├── git-stats.txt
├── files-changed.txt
└── *.diff files
```

---

## Automation Options

### Git Hooks

```bash
# .git/hooks/pre-push (auto-generate analysis)
#!/bin/bash
if [[ $(git branch --show-current) != "main" ]]; then
    echo "Generating pre-push analysis..."
    # Run analysis script
fi
```

### GitHub Actions

```yaml
# .github/workflows/analysis.yml
name: Generate Migration Analysis
on:
  pull_request:
    branches: [main]
jobs:
  analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate Analysis
        run: |
          # Analysis commands
          # Upload as artifact
```

---

## Troubleshooting

### Large Diffs

```bash
# Skip binary files in full diff
git diff main..branch --text > analysis.patch

# Focus on specific directories
git diff main..branch src/ docs/ > focused-analysis.patch

# Limit diff context
git diff main..branch -U1 > minimal-context.patch
```

### Performance Tips

```bash
# Use --name-only for file lists (faster)
git diff --name-only main..branch

# Skip whitespace changes
git diff -w main..branch

# Generate stats only (fastest)
git diff --stat main..branch
```

---

## Example Usage

### WordPress to Astro Migration Analysis

```bash
# Our specific use case
cd /Users/goelak/Developer/medlearnity.com

# Quick overview using script
./scripts/quick-diff.sh main wordpress-content-migration

# Comprehensive analysis using enhanced script
./scripts/generate-focused-diff.sh main wordpress-content-migration docs/analysis/

# View results
ls -la docs/analysis/enhanced-diff-analysis-*.md

# Manual analysis (fallback)
mkdir -p /tmp/wp-astro-analysis
git diff main..astro-migration --stat > /tmp/wp-astro-analysis/migration-stats.txt
git diff main..astro-migration --name-status > /tmp/wp-astro-analysis/files-changed.txt

# Key configuration analysis
git diff main..astro-migration package.json astro.config.mjs tsconfig.json > /tmp/wp-astro-analysis/config-changes.diff

# Review
echo "Analysis complete for WordPress → Astro migration"
ls -la /tmp/wp-astro-analysis/
```

---

_This guide was created during the medlearnity.com WordPress to Astro migration project._
