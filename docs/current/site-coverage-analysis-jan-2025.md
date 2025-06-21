# Site Coverage Analysis - WordPress Migration Validation

**Date**: January 2025  
**Script**: `scripts/validate-site-coverage.js`  
**Target**: https://www.medlearnity.com  
**Astro Pages**: 185 built pages  

## 📊 **Coverage Summary**

- **Total WordPress Pages Discovered**: 257
- **Covered Pages**: 54 (21.0%) ⚠️ **CRITICAL**
- **Missing Pages**: 203 (79.0%)
- **Crawl Errors**: 76 pages with 404s or template artifacts

## 🔍 **Coverage Breakdown**

| Method | Count | Status |
|--------|-------|--------|
| Direct matches | 4 | ✅ Working |
| Explicit redirects | 50 | ✅ Working |
| Dynamic redirects | 0 | ❌ **NOT WORKING** |
| Missing | 203 | ❌ **MAJOR GAP** |

## 🚨 **Critical Issues Identified**

### **1. Tutor Page Redirect Gap**
**Issue**: `/our-tutors/` URLs not redirecting to `/tutors/`

❌ **Missing**: `/our-tutors/keith-cordner/`  
✅ **Have**: `/tutors/keith-cordner/`  
🔧 **Fix**: Add `/our-tutors/:tutor/` → `/tutors/:tutor/` redirect pattern

**Affected Pages** (20+ tutors):
- `/our-tutors/keith-cordner/`, `/our-tutors/dani-brown/`, `/our-tutors/richard-wang/`
- `/our-tutors/keon-youssefzadeh/`, `/our-tutors/radhika-srivastava/`, etc.

### **2. Dynamic Blog Redirects Not Working**
**Issue**: Date-based WordPress URLs not redirecting to `/blog/`

❌ **Zero dynamic redirects caught**  
🔧 **Fix**: Debug dynamic redirect patterns in vercel.json

### **3. Trailing Slash Inconsistency**
**Issue**: WordPress site has pages without trailing slashes

❌ **Missing**: `/start-here` (no trailing slash)  
✅ **Have**: `/start-here/` (with trailing slash)  
🔧 **Fix**: Add non-trailing slash redirects

### **4. Product/Ecommerce Page Gaps**
**Issue**: Product pages not covered

❌ **Missing Examples**:
- `/purchase-discounted-session/`
- `/product/trial-reservation/`
- `/product/10-hour-package/`
- `/radiology-core-shop/`

### **5. WordPress Template Artifacts**
**Issue**: 76 crawl errors from malformed URLs with template variables

❌ **Error Pattern**: `%7B(%7Btcb_post_the_permalink%7D)%7D`  
**Examples**:
- `/blog/%7B(%7Btcb_post_the_permalink%7D)%7D`
- `/usmle/%7B(%7Btcb_post_the_permalink%7D)%7D`

🔧 **Fix**: WordPress site has template rendering issues (not our problem, but affects crawl)

## 📋 **Required Fixes Priority**

### **HIGH PRIORITY**
1. **Add tutor redirect pattern**: `/our-tutors/:tutor/` → `/tutors/:tutor/`
2. **Fix dynamic redirects**: Debug date-based blog URL patterns
3. **Add trailing slash redirects**: Cover non-trailing versions

### **MEDIUM PRIORITY**  
4. **Product page redirects**: Map product URLs to appropriate Astro pages
5. **System page handling**: `/sitemap/`, `/feed/`, etc.

### **LOW PRIORITY**
6. **WordPress template cleanup**: Template artifact URLs (WordPress issue)

## 🎯 **Expected Coverage After Fixes**

- **Current**: 21.0% (54/257)
- **After tutor redirects**: ~29% (+20 pages)
- **After dynamic fixes**: ~60% (+80 blog pages)  
- **After trailing slash**: ~65% (+15 pages)
- **Target**: 85%+ coverage

## 📝 **Action Items**

1. [ ] Add `/our-tutors/:tutor/` redirect pattern to vercel.json
2. [ ] Debug and fix dynamic blog redirect patterns
3. [ ] Add non-trailing slash redirect variants  
4. [ ] Map product/ecommerce URLs to contact/pricing pages
5. [ ] Re-run crawler to validate improvements
6. [ ] Document final coverage report

---

**Next Review**: After implementing high-priority fixes  
**Target Coverage**: 85%+ for production readiness 