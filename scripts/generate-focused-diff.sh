#!/usr/bin/env bash

# Enhanced Focused Migration Diff Generator
# Creates comprehensive, targeted diff analysis with deeper insights
# Limited to ~100,000 words for manageable review

set -euo pipefail

# Configuration
SOURCE_BRANCH="${1:-main}"
TARGET_BRANCH="${2:-$(git branch --show-current)}"
OUTPUT_DIR="${3:-./docs/analysis}"
TIMESTAMP=$(date +%Y%m%d-%H%M)
ANALYSIS_FILE="$OUTPUT_DIR/enhanced-diff-analysis-$TIMESTAMP.md"

# Word count tracking
MAX_WORDS=100000
CURRENT_WORDS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# File patterns to exclude from detailed analysis
EXCLUDE_PATTERNS=(
    "*.log"
    "*.lock"
    "package-lock.json"
    "node_modules/*"
    "dist/*"
    ".astro/*"
    ".vercel/*"
    "*.jpg"
    "*.png"
    "*.gif"
    "*.woff*"
    "*.pdf"
)

# Critical files for detailed analysis
CRITICAL_FILES=(
    "package.json"
    "astro.config.*"
    "tsconfig.json"
    "vercel.json"
    ".env.example"
    "src/consts.ts"
    "src/components/BaseHead.astro"
    ".github/workflows/*"
)

# Directories for impact analysis
KEY_DIRECTORIES=(
    "src/"
    "docs/"
    "scripts/"
    ".github/"
    "public/"
)

count_words() {
    echo "$1" | wc -w | tr -d ' '
}

add_section() {
    local content="$1"
    local word_count=$(count_words "$content")
    
    if (( CURRENT_WORDS + word_count > MAX_WORDS )); then
        echo "⚠️  Approaching word limit, truncating content..."
        return 1
    fi
    
    echo "$content" >> "$ANALYSIS_FILE"
    CURRENT_WORDS=$((CURRENT_WORDS + word_count))
    return 0
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} Enhanced Migration Diff Generator${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Source: ${GREEN}$SOURCE_BRANCH${NC}"
    echo -e "Target: ${GREEN}$TARGET_BRANCH${NC}"
    echo -e "Output: ${GREEN}$ANALYSIS_FILE${NC}"
    echo -e "Max Words: ${YELLOW}$MAX_WORDS${NC}"
    echo ""
}

generate_executive_summary() {
    local summary="# Enhanced Migration Diff Analysis
**Generated**: $(date)  
**Repository**: $(basename $(git remote get-url origin 2>/dev/null || echo "local-repo") .git)  
**Comparison**: \`$SOURCE_BRANCH\` → \`$TARGET_BRANCH\`  
**Analyst**: $(git config user.name 2>/dev/null || echo "Unknown")  
**Word Limit**: $MAX_WORDS words

---

## 🎯 Executive Summary

### Migration Overview
- **Total Files Changed**: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ')
- **Lines Modified**: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --shortstat)
- **Commits Ahead**: $(git rev-list --count $SOURCE_BRANCH..$TARGET_BRANCH 2>/dev/null || echo "0")
- **Analysis Scope**: Enhanced analysis with dependency, security, and performance impact

### Quick Impact Assessment
"
    
    # Assess impact level
    local files_changed=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ')
    local impact_level=""
    
    if (( files_changed > 200 )); then
        impact_level="🔴 **MAJOR MIGRATION** - Comprehensive changes across codebase"
    elif (( files_changed > 50 )); then
        impact_level="🟡 **SIGNIFICANT UPDATE** - Multiple components affected"
    else
        impact_level="🟢 **MINOR CHANGES** - Limited scope, focused updates"
    fi
    
    summary+="- **Impact Level**: $impact_level
- **Review Priority**: $([ $files_changed -gt 100 ] && echo "HIGH - Requires thorough review" || echo "MEDIUM - Standard review process")

---

"
    
    add_section "$summary" || return 1
}

generate_dependency_analysis() {
    local content="## 📦 Dependency Analysis

"
    
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "package.json"; then
        content+="### Package.json Changes Detected

"
        
        # Analyze dependency changes
        if [[ -f "package.json" ]]; then
            local deps_added=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep "^+" | grep -c "\".*\":" || echo "0")
            local deps_removed=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep "^-" | grep -c "\".*\":" || echo "0")
            local scripts_added=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep "^+" | grep -c "\".*\": " || echo "0")
            
            content+="| Change Type | Count | Impact |
|-------------|-------|--------|
| Dependencies Added | $deps_added | $([ $deps_added -gt 5 ] && echo "HIGH - Review for security/compatibility" || echo "LOW - Standard additions") |
| Dependencies Removed | $deps_removed | $([ $deps_removed -gt 0 ] && echo "MEDIUM - Check for breaking changes" || echo "NONE") |
| Scripts Added | $scripts_added | $([ $scripts_added -gt 3 ] && echo "HIGH - New workflow capabilities" || echo "LOW") |

"
            
            # Show actual dependency changes
            content+="### Dependency Changes Detail
\`\`\`diff
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | head -30)
\`\`\`

"
            
            # Security analysis
            content+="### Security Considerations
"
            if git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep -q -E "(dotenv|env|secret|key|token)"; then
                content+="- ⚠️  **Environment/Security related packages detected** - Review for secure configuration
"
            fi
            
            if git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep -q -E "(prettier|eslint|lint|check)"; then
                content+="- ✅ **Code quality tools added** - Improved development workflow
"
            fi
            
            if git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep -q -E "(build|deploy|ci|cd)"; then
                content+="- 🚀 **Build/Deploy tools detected** - Enhanced deployment pipeline
"
            fi
        fi
    else
        content+="### No Package.json Changes
No dependency modifications detected in this diff.

"
    fi
    
    add_section "$content" || return 1
}

generate_security_impact() {
    local content="## 🔒 Security Impact Analysis

"
    
    # Check for security-related files
    local security_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(\.env|security|auth|token|key|secret|config)" || echo "")
    
    if [[ -n "$security_files" ]]; then
        content+="### Security-Related Files Modified
\`\`\`
$security_files
\`\`\`

"
        
        # Analyze .env changes
        if echo "$security_files" | grep -q "\.env"; then
            content+="### Environment Configuration Changes
"
            
            local env_files=$(echo "$security_files" | grep "\.env")
            for file in $env_files; do
                if [[ -f "$file" ]]; then
                    content+="**$file**:
\`\`\`diff
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH "$file" | head -20)
\`\`\`

"
                fi
            done
            
            content+="**Security Recommendations**:
- ✅ Verify no secrets are committed
- ✅ Check .env.example includes all required variables
- ✅ Confirm production environment variables are set
- ✅ Review access controls for sensitive configurations

"
        fi
    fi
    
    # Check for security headers in vercel.json
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "vercel.json"; then
        content+="### Vercel Configuration Security
"
        
        if git diff $SOURCE_BRANCH..$TARGET_BRANCH vercel.json | grep -q -E "(headers|security|csp|frame|content-security)"; then
            content+="- ✅ **Security headers detected** - Enhanced browser security
"
            
            # Show security headers
            content+="**Security Headers Added**:
\`\`\`json
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH vercel.json | grep -A 20 -B 5 -E "(headers|X-Frame|Content-Security|X-Content-Type)" | head -30)
\`\`\`

"
        fi
    fi
    
    # Check for authentication or authorization changes
    local auth_changes=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(auth|login|session|middleware)" || echo "")
    if [[ -n "$auth_changes" ]]; then
        content+="### Authentication/Authorization Changes
\`\`\`
$auth_changes
\`\`\`
**Review Required**: Authentication logic modifications detected.

"
    fi
    
    add_section "$content" || return 1
}

generate_performance_impact() {
    local content="## ⚡ Performance Impact Analysis

"
    
    # Check for performance-affecting changes
    local perf_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(config|build|asset|image|font|css|js)" || echo "")
    
    if [[ -n "$perf_files" ]]; then
        content+="### Performance-Related Files
\`\`\`
$(echo "$perf_files" | head -15)
\`\`\`

"
        
        # Analyze build configuration changes
        if echo "$perf_files" | grep -q -E "(astro\.config|vite\.config|build)"; then
            content+="### Build Configuration Impact
"
            
            local build_files=$(echo "$perf_files" | grep -E "(astro\.config|vite\.config|build)")
            for file in $build_files; do
                if [[ -f "$file" ]]; then
                    content+="**$file**:
\`\`\`diff
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH "$file" | head -15)
\`\`\`

"
                fi
            done
        fi
        
        # Check for image/asset changes
        local media_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "\.(jpg|png|gif|webp|woff|woff2|css|js)$" | wc -l | tr -d ' ')
        if (( media_files > 0 )); then
            content+="### Media/Asset Changes
- **Files Modified**: $media_files assets
- **Impact**: $([ $media_files -gt 20 ] && echo "HIGH - Significant asset changes may affect load times" || echo "LOW - Minimal impact expected")

"
        fi
    fi
    
    # Bundle size analysis (if build files exist)
    if [[ -d "dist" ]]; then
        local bundle_size=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "Unknown")
        content+="### Current Bundle Size
- **Dist Directory**: $bundle_size
- **Recommendation**: Compare with previous build to assess size impact

"
    fi
    
    add_section "$content" || return 1
}

generate_breaking_changes() {
    local content="## 🚨 Breaking Changes Detection

"
    
    local breaking_indicators=0
    
    # Check for major version updates in package.json
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep -E "\"[^\"]+\": \"[0-9]+\." >/dev/null 2>&1; then
        content+="### Dependency Version Changes
"
        content+="$(git diff $SOURCE_BRANCH..$TARGET_BRANCH package.json | grep -E "[\+-].*\"[^\"]+\": \"[0-9]+" | head -10)

**Review Required**: Check for breaking changes in updated dependencies.

"
        ((breaking_indicators++))
    fi
    
    # Check for API/interface changes
    local interface_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "\.(ts|js|astro)$" | head -5)
    if [[ -n "$interface_files" ]]; then
        content+="### API/Interface Changes
"
        
        for file in $interface_files; do
            if git diff $SOURCE_BRANCH..$TARGET_BRANCH "$file" | grep -E "(export|interface|type|function|const)" >/dev/null 2>&1; then
                content+="**$file**: Potential interface changes detected
"
                ((breaking_indicators++))
            fi
        done
        
        if (( breaking_indicators > 0 )); then
            content+="
**Impact**: Review exported functions, types, and interfaces for compatibility.

"
        fi
    fi
    
    # Check for configuration changes
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(config|\.env)" >/dev/null 2>&1; then
        content+="### Configuration Changes
- ⚠️  **Configuration files modified** - Review for environment compatibility
- 🔍 **Check**: Ensure all required environment variables are documented

"
        ((breaking_indicators++))
    fi
    
    # Summary
    if (( breaking_indicators == 0 )); then
        content+="### ✅ No Breaking Changes Detected
Analysis suggests changes are backward compatible.

"
    else
        content+="### ⚠️  Potential Breaking Changes: $breaking_indicators areas identified
**Recommendation**: Thorough testing recommended before deployment.

"
    fi
    
    add_section "$content" || return 1
}

generate_content_analysis() {
    local content="## 📝 Content & Documentation Analysis

"
    
    # Analyze markdown files
    local md_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "\.md$" | wc -l | tr -d ' ')
    local new_md=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | grep "^A.*\.md$" | wc -l | tr -d ' ')
    local modified_md=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | grep "^M.*\.md$" | wc -l | tr -d ' ')
    
    content+="### Documentation Changes
| Type | Count | Notes |
|------|-------|-------|
| **Total MD Files** | $md_files | $([ $md_files -gt 50 ] && echo "Major documentation update" || echo "Standard documentation changes") |
| **New Files** | $new_md | $([ $new_md -gt 10 ] && echo "Significant new content" || echo "Minor additions") |
| **Modified Files** | $modified_md | $([ $modified_md -gt 20 ] && echo "Extensive content updates" || echo "Limited modifications") |

"
    
    # Analyze content types
    local blog_posts=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "blog.*\.md$" | wc -l | tr -d ' ')
    local guides=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(guide|tutorial|how-to)" | wc -l | tr -d ' ')
    local docs=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "docs/" | wc -l | tr -d ' ')
    
    if (( blog_posts > 0 || guides > 0 || docs > 0 )); then
        content+="### Content Type Breakdown
- **Blog Posts**: $blog_posts new/modified
- **Guides/Tutorials**: $guides files
- **Documentation**: $docs files

"
    fi
    
    # Sample new content (first few blog posts)
    local new_blog_posts=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status | grep "^A.*blog.*\.md$" | head -5)
    if [[ -n "$new_blog_posts" ]]; then
        content+="### New Content Preview
\`\`\`
$new_blog_posts
\`\`\`

"
    fi
    
    # Check for README updates
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "README"; then
        content+="### README Changes
**Impact**: Project documentation updated - review for accuracy.

**Changes Preview**:
\`\`\`diff
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH README.md | head -20)
\`\`\`

"
    fi
    
    add_section "$content" || return 1
}

generate_migration_insights() {
    local content="## 🔄 Migration-Specific Insights

"
    
    # Detect migration type
    local migration_type="Unknown"
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "wordpress\|wp-"; then
        migration_type="WordPress Migration"
    elif git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "astro"; then
        migration_type="Astro Framework"
    elif git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "content"; then
        migration_type="Content Migration"
    fi
    
    content+="### Migration Context
- **Type**: $migration_type
- **Scope**: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ') files affected

"
    
    # Analyze content migration patterns
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -q "content/"; then
        local content_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "content/" | wc -l | tr -d ' ')
        content+="### Content Migration Analysis
- **Content Files**: $content_files migrated
- **Structure**: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "content/" | head -3 | sed 's/.*content\///' | cut -d'/' -f1 | sort -u | tr '\n' ', ' | sed 's/,$//')

"
    fi
    
    # Check for URL/routing changes
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(redirect|routing|slug|url)" >/dev/null 2>&1; then
        content+="### URL/Routing Impact
- ⚠️  **URL structure changes detected**
- 📋 **SEO Impact**: Review redirects and canonical URLs
- 🔍 **Testing Required**: Verify all routes work correctly

"
    fi
    
    # Analyze vercel.json for redirects
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH vercel.json | grep -q "redirect" 2>/dev/null; then
        local redirect_count=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH vercel.json | grep -c "source.*destination" || echo "0")
        content+="### SEO Redirect Strategy
- **Redirects Configured**: $redirect_count rules
- **SEO Preservation**: $([ $redirect_count -gt 10 ] && echo "Comprehensive redirect strategy" || echo "Limited redirects - verify coverage")

"
    fi
    
    add_section "$content" || return 1
}

generate_testing_recommendations() {
    local content="## 🧪 Testing & Validation Recommendations

"
    
    # Generate testing checklist based on changes
    content+="### Pre-Deployment Testing Checklist

#### Build & Infrastructure
- [ ] **Build Process**: \`npm run build\` completes successfully
- [ ] **Type Checking**: \`npm run check\` passes without errors
- [ ] **Linting**: Code quality checks pass
- [ ] **Dependencies**: No security vulnerabilities (\`npm audit\`)

"
    
    # Content-specific testing
    local md_changes=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep "\.md$" | wc -l | tr -d ' ')
    if (( md_changes > 0 )); then
        content+="#### Content Validation
- [ ] **Markdown Rendering**: All new content displays correctly
- [ ] **Image Links**: Verify all images load properly
- [ ] **Internal Links**: Cross-references work correctly
- [ ] **SEO Meta**: Titles, descriptions, and meta tags are complete

"
    fi
    
    # Configuration testing
    if git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "(config|\.env)" >/dev/null 2>&1; then
        content+="#### Configuration Testing
- [ ] **Environment Variables**: All required vars documented and set
- [ ] **Build Configuration**: Deployment settings verified
- [ ] **Security Headers**: Response headers include security measures
- [ ] **Redirects**: URL redirections work as expected

"
    fi
    
    # Performance testing
    content+="#### Performance Validation
- [ ] **Page Load Speed**: Core Web Vitals within targets
- [ ] **Bundle Size**: No significant size increase
- [ ] **Image Optimization**: Assets properly optimized
- [ ] **Caching**: Cache headers configured correctly

"
    
    add_section "$content" || return 1
}

generate_detailed_file_changes() {
    local content="## 📋 Detailed File Changes

"
    
    # Show critical file changes in detail
    content+="### Critical Files Analysis

"
    
    for pattern in "${CRITICAL_FILES[@]}"; do
        local files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | grep -E "$pattern" 2>/dev/null || true)
        if [[ -n "$files" ]]; then
            for file in $files; do
                content+="#### $file
"
                
                # Show change type
                local change_type=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-status "$file" | cut -f1)
                case $change_type in
                    A) content+="**Status**: ✅ New file added
" ;;
                    M) content+="**Status**: 📝 Modified
" ;;
                    D) content+="**Status**: ❌ Deleted
" ;;
                    R*) content+="**Status**: 🔄 Renamed/Moved
" ;;
                esac
                
                # Show actual changes (limited)
                content+="
<details><summary>View Changes</summary>

\`\`\`diff
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH "$file" | head -40)
\`\`\`
</details>

"
                
                # Check word count and break if approaching limit
                if (( CURRENT_WORDS > MAX_WORDS * 8 / 10 )); then
                    content+="... (Additional files truncated due to word limit)

"
                    break 2
                fi
            done
        fi
    done
    
    add_section "$content" || return 1
}

generate_summary_statistics() {
    local content="## 📊 Summary Statistics

### File Change Breakdown
\`\`\`
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --stat | head -20)
\`\`\`

### File Type Distribution
\`\`\`
$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -10)
\`\`\`

### Directory Impact
"
    
    for dir in "${KEY_DIRECTORIES[@]}"; do
        if [[ -d "$dir" ]]; then
            local changes=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only "$dir" 2>/dev/null | wc -l | tr -d ' ')
            if (( changes > 0 )); then
                content+="- **$dir**: $changes files changed
"
            fi
        fi
    done
    
    content+="
### Change Complexity Score
"
    
    local total_files=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ')
    local total_lines=$(git diff $SOURCE_BRANCH..$TARGET_BRANCH --numstat | awk '{sum+=$1+$2} END {print sum}' 2>/dev/null || echo "0")
    
    local complexity="Low"
    if (( total_files > 100 && total_lines > 10000 )); then
        complexity="High"
    elif (( total_files > 50 || total_lines > 5000 )); then
        complexity="Medium"
    fi
    
    content+="- **Complexity**: $complexity
- **Review Time Estimate**: $([ "$complexity" = "High" ] && echo "4-6 hours" || [ "$complexity" = "Medium" ] && echo "2-3 hours" || echo "1-2 hours")

"
    
    add_section "$content" || return 1
}

main() {
    print_header
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Check if branches exist
    if ! git show-ref --verify --quiet refs/heads/$SOURCE_BRANCH && ! git show-ref --verify --quiet refs/remotes/origin/$SOURCE_BRANCH; then
        echo -e "${RED}Error: Branch '$SOURCE_BRANCH' not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Generating enhanced diff analysis...${NC}"
    
    # Initialize analysis file
    echo "" > "$ANALYSIS_FILE"
    
    # Generate sections in order of importance
    echo -e "${PURPLE}📋 Executive Summary...${NC}"
    generate_executive_summary || { echo "Word limit reached at Executive Summary"; }
    
    echo -e "${PURPLE}📦 Dependency Analysis...${NC}"
    generate_dependency_analysis || { echo "Word limit reached at Dependency Analysis"; }
    
    echo -e "${PURPLE}🔒 Security Impact...${NC}"
    generate_security_impact || { echo "Word limit reached at Security Analysis"; }
    
    echo -e "${PURPLE}⚡ Performance Impact...${NC}"
    generate_performance_impact || { echo "Word limit reached at Performance Analysis"; }
    
    echo -e "${PURPLE}🚨 Breaking Changes...${NC}"
    generate_breaking_changes || { echo "Word limit reached at Breaking Changes"; }
    
    echo -e "${PURPLE}📝 Content Analysis...${NC}"
    generate_content_analysis || { echo "Word limit reached at Content Analysis"; }
    
    echo -e "${PURPLE}🔄 Migration Insights...${NC}"
    generate_migration_insights || { echo "Word limit reached at Migration Insights"; }
    
    echo -e "${PURPLE}📋 Detailed Changes...${NC}"
    generate_detailed_file_changes || { echo "Word limit reached at Detailed Changes"; }
    
    echo -e "${PURPLE}🧪 Testing Recommendations...${NC}"
    generate_testing_recommendations || { echo "Word limit reached at Testing Recommendations"; }
    
    echo -e "${PURPLE}📊 Summary Statistics...${NC}"
    generate_summary_statistics || { echo "Word limit reached at Summary Statistics"; }
    
    # Add footer
    echo "---" >> "$ANALYSIS_FILE"
    echo "*Enhanced analysis completed at $(date)*  " >> "$ANALYSIS_FILE"
    echo "*Word count: ~$CURRENT_WORDS words*" >> "$ANALYSIS_FILE"
    
    echo -e "${GREEN}✅ Enhanced diff analysis complete!${NC}"
    echo -e "📄 Analysis saved to: ${BLUE}$ANALYSIS_FILE${NC}"
    echo -e "📊 Word count: ${YELLOW}~$CURRENT_WORDS${NC} words"
    echo ""
    echo -e "${YELLOW}Quick summary:${NC}"
    echo "- Files changed: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --name-only | wc -l | tr -d ' ')"
    echo "- Lines: $(git diff $SOURCE_BRANCH..$TARGET_BRANCH --shortstat)"
    echo "- Analysis scope: Enhanced with security, performance, and migration insights"
    echo ""
    echo -e "${BLUE}View analysis:${NC} cat $ANALYSIS_FILE"
}

# Help function
show_help() {
    echo "Enhanced Focused Migration Diff Generator"
    echo ""
    echo "Usage: $0 [SOURCE_BRANCH] [TARGET_BRANCH] [OUTPUT_DIR]"
    echo ""
    echo "Features:"
    echo "  - Comprehensive dependency analysis"
    echo "  - Security impact assessment"
    echo "  - Performance impact analysis"
    echo "  - Breaking changes detection"
    echo "  - Content migration insights"
    echo "  - Testing recommendations"
    echo "  - Limited to ~100,000 words for manageable review"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Compare main to current branch"
    echo "  $0 main astro-migration              # Compare main to astro-migration"
    echo "  $0 main feature-branch ./reports     # Custom output directory"
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main 