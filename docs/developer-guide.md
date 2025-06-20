# Developer Guide - medlearnity.com

A comprehensive guide for developers working on the medlearnity.com Astro project, containing common commands and workflows.

## Table of Contents

- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Code Quality & Linting](#code-quality--linting)
- [Build & Deployment](#build--deployment)
- [Git Workflow](#git-workflow)
- [Testing & Validation](#testing--validation)
- [Content Management](#content-management)
- [WordPress Content Export](#wordpress-content-export)
- [Troubleshooting](#troubleshooting)

## Project Setup

### Initial Setup
```bash
# Clone repository
git clone https://github.com/tech-med/medlearnity.com.git
cd medlearnity.com

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Configuration
```bash
# Set site URL for production
export PUBLIC_SITE_URL=https://medlearnity.com

# For local development
export PUBLIC_SITE_URL=http://localhost:4321
```

## Development Workflow

### Start Development Server
```bash
# Start dev server with hot reload
npm run dev

# Alternative with specific port
npm run dev -- --port 3000

# Open in browser automatically
npm run dev -- --open
```

### Build for Production
```bash
# Build static site
npm run build

# Preview production build locally
npm run preview

# Build and preview in sequence
npm run build && npm run preview
```

## Code Quality & Linting

### ESLint Commands
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint specific files
npx eslint src/components/Header.astro

# Lint with detailed output
npx eslint . --format=table
```

### Prettier Formatting
```bash
# Format all files
npm run format

# Check formatting without fixing
npm run format:check

# Format specific files
npx prettier --write src/pages/*.astro

# Format with specific config
npx prettier --write . --config .prettierrc
```

### Type Checking
```bash
# Run TypeScript type check
npm run astro:check

# Type check with detailed output
npx astro check --verbose

# Watch mode for type checking
npx tsc --noEmit --watch
```

### All Quality Checks
```bash
# Run all quality checks in sequence
npm run lint && npm run format:check && npm run astro:check && npm run build
```

## Build & Deployment

### Local Build Validation
```bash
# Full build pipeline
npm run build 2>&1 | tee build.log

# Check build output size
du -sh dist/

# Validate generated files
ls -la dist/
find dist/ -name "*.html" | head -5
```

### Production Deployment (Vercel)
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

### Manual Server Testing
```bash
# Test local server endpoints
curl -I http://localhost:4321/
curl -I http://localhost:4321/blog/
curl -I http://localhost:4321/about/
curl -I http://localhost:4321/rss.xml

# Check response times
time curl -s http://localhost:4321/ > /dev/null
```

## Git Workflow

### Branch Management
```bash
# Create feature branch
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# Switch branches
git checkout main
git checkout feature/new-feature

# Delete merged branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### Commit Workflow
```bash
# Stage and commit changes
git add .
git commit -m "feat: add new blog post component"

# Amend last commit
git commit --amend -m "feat: add new blog post component with proper styling"

# Interactive staging
git add -p
```

### Pull Request Workflow
```bash
# Create PR via GitHub CLI
gh pr create --title "Feature: New Blog Component" --body "Adds responsive blog component with accessibility features"

# List PRs
gh pr list

# Check PR status
gh pr status

# Merge PR
gh pr merge 1 --merge --delete-branch

# Review PR locally
gh pr checkout 1
```

### Sync with Remote
```bash
# Fetch latest changes
git fetch origin

# Pull latest main
git checkout main
git pull origin main

# Rebase feature branch
git checkout feature/new-feature
git rebase main
```

## Testing & Validation

### Content Validation
```bash
# Check content collections
npm run astro:check

# Validate markdown files
find src/content -name "*.md" -exec echo "Checking: {}" \; -exec head -n 5 {} \;

# Check for broken internal links
grep -r "\[.*\](/" src/content/
```

### Image Optimization Check
```bash
# Check image formats in build
find dist/ -name "*.webp" | wc -l
find dist/ -name "*.jpg" -o -name "*.png" | wc -l

# Compare image sizes
ls -lh src/assets/*.jpg
ls -lh dist/_astro/*.webp
```

### Performance Testing
```bash
# Basic performance check
time npm run build

# Check bundle sizes
npx astro build --verbose

# Analyze build output
du -sh dist/*/ | sort -h
```

## Content Management

### Blog Posts
```bash
# Create new blog post
touch "src/content/blog/$(date +%Y-%m-%d)-new-post.md"

# List all blog posts
ls -la src/content/blog/

# Check blog post frontmatter
head -n 10 src/content/blog/*.md
```

### Content Collections
```bash
# Validate content config
cat src/content/config.ts

# Check content structure
tree src/content/

# Verify content types
grep -r "collection:" src/content/
```

---

## WordPress Content Export

### Flywheel SSH Setup

**Initial SSH Connection Test**
```bash
# Test SSH connection to Flywheel
ssh -o BatchMode=yes -o ConnectTimeout=10 team+medlearnity+medlearnity@ssh.getflywheel.com "echo 'SSH connection successful!'"
```

**Connect to WordPress Site**
```bash
# Connect directly to medlearnity site
ssh team+medlearnity+medlearnity@ssh.getflywheel.com

# Or use generic connection and select from menu
ssh team+medlearnity+medlearnity@ssh.getflywheel.com
```

### Content Export Commands

**WordPress XML Export**
```bash
# Create export directory (run locally first)
mkdir -p backups/wordpress-export

# Connect to Flywheel and export content
ssh team+medlearnity+medlearnity@ssh.getflywheel.com

# Once connected to WordPress site:
wp export --dir=~/exports/
wp export --dir=~/exports/ --post_type=post,page --with_attachments

# Download exported files via SFTP
sftp team+medlearnity+medlearnity@ssh.getflywheel.com
get -r exports/
```

**Site Audit Commands (on Flywheel)**
```bash
# List all posts and pages
wp post list --post_type=post,page --format=table

# Check for custom post types
wp post-type list

# List installed plugins
wp plugin list

# Check for forms and custom fields
wp post meta list --post_id=1
grep -r "jotform\|contact.*form" wp-content/themes/
```

**Database Export (if needed)**
```bash
# Export database
wp db export ~/exports/database-$(date +%Y%m%d).sql

# Export specific tables
wp db export ~/exports/posts-$(date +%Y%m%d).sql --tables=wp_posts,wp_postmeta
```

### Content Conversion Workflow

**Convert WordPress XML to Markdown**
```bash
# Install conversion tool
npm install --save-dev wordpress-export-to-markdown

# Convert *all* exported XML files in one pass (non-interactive)
npx wordpress-export-to-markdown \
  --input=backups/wordpress-export \
  --output=./content-converted \
  --post-folders=true \
  --save-images none \
  --wizard false

# Organize converted content
mkdir -p src/content/blog src/content/pages public/images/wp
mv content-converted/posts/*  src/content/blog/
mv content-converted/pages/*  src/content/pages/

# Copy WordPress uploads (media)
rsync -a /path/to/wp-content/uploads/ public/images/wp/

# Update image references inside Markdown
grep -rl "wp-content/uploads" src/content | xargs sed -i '' 's|wp-content/uploads|/images/wp|g'
```

**Content Validation After Import**
```bash
# Validate frontmatter structure
grep -r "^---$" src/content/blog/ | wc -l  # Should be even number

# Check for required fields
grep -L "title:" src/content/blog/*.md
grep -L "pubDate:" src/content/blog/*.md

# Validate with Astro
npm run astro:check

# Preview content
npm run dev
```

**Content Cleanup Scripts**
```bash
# Fix common frontmatter issues
find src/content -name "*.md" -exec sed -i 's/date:/pubDate:/g' {} \;

# Remove WordPress shortcodes
find src/content -name "*.md" -exec sed -i 's/\[caption[^\]]*\]//g' {} \;

# Convert WordPress image syntax
find src/content -name "*.md" -exec sed -i 's/wp-content\/uploads/images/g' {} \;
```

### Backup and Archive

**Create Migration Backup**
```bash
# Archive WordPress export
tar -czf backups/wordpress-export-$(date +%Y%m%d).tar.gz backups/wordpress-export/

# Archive converted content
tar -czf backups/content-converted-$(date +%Y%m%d).tar.gz content-converted/

# Create migration log
echo "Migration started: $(date)" > logs/migration-$(date +%Y%m%d).log
echo "WordPress export completed: $(date)" >> logs/migration-$(date +%Y%m%d).log
```

## Troubleshooting

### Common Issues

#### SSH Connection Issues
```bash
# Add Flywheel host key if needed
ssh-keyscan ssh.getflywheel.com >> ~/.ssh/known_hosts

# Check SSH key is loaded
ssh-add -l

# Verbose SSH connection for debugging
ssh -vvv team+medlearnity+medlearnity@ssh.getflywheel.com
```

#### WordPress Export Issues
```bash
# Check WP-CLI version on Flywheel
wp --version

# Test WP-CLI connection
wp option get siteurl

# Check disk space for exports
df -h ~/exports/

# Alternative export methods if WP-CLI fails
wp db export - | gzip > backup.sql.gz
```

#### Content Conversion Issues
```bash
# Check XML file validity
xmllint --noout backups/wordpress-export/export.xml

# Validate converted markdown
find content-converted -name "*.md" -exec head -5 {} \;

# Check for encoding issues
file -bi content-converted/posts/*.md
```

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
rm -rf dist/
npm run build

# Check for TypeScript errors
npm run astro:check 2>&1 | grep -i error

# Verbose build output
npm run build -- --verbose
```

#### Development Server Issues
```bash
# Kill processes on port 4321
lsof -ti:4321 | xargs kill -9

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be >= 20
```

#### Git Issues
```bash
# Reset local changes
git stash push -m "WIP: temporary stash"
git reset --hard HEAD

# Fix merge conflicts
git status
git add .
git commit -m "resolve: merge conflicts"

# Clean untracked files
git clean -fd
```

### Debug Commands
```bash
# Check environment variables
env | grep PUBLIC_

# Verify Astro config
cat astro.config.mjs

# Check package versions
npm list --depth=0

# Node.js and npm versions
node --version && npm --version
```

### Log Analysis
```bash
# Monitor build logs
npm run build 2>&1 | tee logs/build-$(date +%Y%m%d-%H%M).log

# Check for warnings
npm run build 2>&1 | grep -i warning

# Monitor development server
npm run dev 2>&1 | tee logs/dev-$(date +%Y%m%d-%H%M).log
```

## Useful Scripts

### Custom Commands
```bash
# Full quality pipeline
alias quality-check="npm run lint && npm run format:check && npm run astro:check && npm run build"

# Quick development setup
alias dev-setup="npm install && npm run dev"

# Production validation
alias prod-validate="npm run build && npm run preview"
```

### Backup & Restore
```bash
# Backup content
tar -czf backups/content-$(date +%Y%m%d).tar.gz src/content/

# Backup configuration
cp -r {astro.config.mjs,package.json,tsconfig.json} backups/

# Quick project snapshot
git archive --format=tar.gz --output=snapshots/project-$(date +%Y%m%d).tar.gz HEAD
```

---

## Project Information

- **Framework**: Astro v4.x
- **TypeScript**: v5.x
- **Node.js**: >= 20.x
- **Package Manager**: npm
- **Deployment**: Vercel Edge Network
- **Content**: Markdown with Frontmatter

## Contributing

1. Follow the [Git Workflow](#git-workflow) for all changes
2. Run [Code Quality](#code-quality--linting) checks before committing
3. Ensure [Build & Deployment](#build--deployment) validation passes
4. Update this guide when adding new workflows or commands

---

*Last updated: December 2024*
+*Last updated: June 2025* 