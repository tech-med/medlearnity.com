# Migrating a WordPress Site (Flywheel) to an Astro Static Site on Vercel

**Migrating from a dynamic WordPress site to a static Astro site requires careful planning.** This guide provides a comprehensive step-by-step plan to rebuild your site in Astro (using Markdown for content), migrate all content, preserve forms and analytics, test on Vercel's preview environment, set up URL redirects, and prepare for future A/B testing with GrowthBook.

---

## Preparation and Planning

Before you begin, take some time to plan the migration and gather necessary tools:

* **Backup your WordPress site:** Export a full backup of your WordPress database and files (Flywheel provides easy backup options). This ensures you have a recovery point in case anything is missing later.
* **Export content:** Use WordPress's built-in export (Tools › Export › "All content") to get an XML file of your site's content. This will be converted to Markdown for Astro.
* **Identify assets & features:** List out all pages, posts, media, and features on the WordPress site:
  * Pages/posts to migrate (e.g., About, Blog posts, etc.).
  * **Embedded forms** (e.g., JotForm scripts) – note their locations.
  * **Analytics/tracking codes** – find any Google Tag Manager (GTM), Google Analytics (GA), or Google Ads conversion scripts in the WordPress theme or plugins.
  * **SEO or redirects** – note current URL structure (permalinks) and any important URLs to retain.
* **Set up tools:** Ensure you have Node.js and npm installed for Astro. Create accounts or have access for third-party services (Vercel, GrowthBook, GTM/GA, etc.).
* **Plan the new site structure:** Decide how your content will be organized in Astro. You may keep the same URL structure as WordPress for simplicity (to minimize redirects) or choose a new structure (e.g., all blog posts under `/blog/`). Knowing this upfront will help with content placement and redirect planning.

---

## Setting Up the Astro Project

1. **Create a new Astro site**
   ```bash
   npm create astro@latest -- --template blog
   ```
2. **Install dependencies**
   ```bash
   cd your-astro-project
   npm install
   npm run dev
   ```
3. **Choose an Astro adapter** – For a purely static site, no additional adapter is needed. If you anticipate SSR later, add the Vercel adapter in hybrid mode.
4. **Version control** – Initialize a Git repository and commit the baseline Astro project.

---

## Exporting and Converting WordPress Content to Markdown

1. **Export WordPress XML** via Tools › Export.
2. **Convert XML to Markdown** using:
   ```bash
   npx wordpress-export-to-markdown
   ```
3. **Review and organize Markdown files** – Clean up frontmatter, fix formatting, move images into `public/` and update links.
4. **Copy Markdown into Astro project** – Place pages/posts in `src/pages` or content collections, then run `npm run dev` to verify.

---

## Rebuilding Pages & Preserving Embedded Forms (JotForm)

* Copy each JotForm embed snippet from WordPress and paste into the corresponding `.md` or `.astro` file.
* Run the dev server and confirm the form loads and submits properly.

---

## Integrating Google Tag Manager, Analytics & Conversion Tracking

1. **Add GTM snippet** to your base layout:
   ```astro
   <!-- Google Tag Manager -->
   <script is:inline>/* GTM script with GTM-XXXX */</script>
   <!-- End GTM -->
   ```
2. **Google Analytics** – Prefer deploying GA via GTM. Otherwise, add gtag directly in `<head>`.
3. **Google Ads conversions** – Fire via GTM or embed `gtag('event', 'conversion', { ... })` on the thank-you page.
4. **Verify** tracking with Tag Assistant and GA Real-Time.

---

## Deploying to Vercel (Preview Testing)

1. **Create a Vercel project** and connect your Git repo.
2. **Trigger a deployment** – Every branch push creates a preview URL.
3. **Test the preview** – Browse pages, submit forms, check analytics, run Lighthouse.
4. **Configure a custom domain** but hold off on switching DNS until everything is approved.

---

## Setting Up Redirects for Original URLs

Create a `vercel.json`:
```json
{
  "redirects": [
    { "source": "/:year/:month/:slug", "destination": "/blog/:slug", "permanent": true },
    { "source": "/contact-us", "destination": "/contact", "permanent": true }
  ]
}
```
Push, deploy, then test redirects on the preview domain.

---

## Final Review, Go-Live & DNS Switch

1. **Comprehensive testing** on preview.
2. **Performance & SEO checks** (Lighthouse, sitemap, robots.txt).
3. **Switch DNS** to Vercel during low traffic.
4. **Verify live site** – HTTPS, forms, analytics, redirects.
5. **Post-launch monitoring** – GA, Search Console, Vercel logs.

---

## Preparing for GrowthBook (A/B Testing)

1. **Get GrowthBook client key**.
2. **Add GrowthBook snippet** in `<head>`:
   ```html
   <script async data-client-key="YOUR_SDK_CLIENT_KEY" src="https://cdn.jsdelivr.net/npm/@growthbook/growthbook/dist/bundles/auto.min.js"></script>
   ```
3. **No experiments yet** – but integration is ready for future tests.

---

## Post-Migration Checklist

| Task | Status |
| ---- | ------ |
| Backup WordPress site | ✅ |
| Export content | ✅ |
| Convert to Markdown | ✅ |
| Astro project set up | ✅ |
| Import Markdown content | ✅ |
| Images & media updated | ✅ |
| Rebuild pages in Astro | ✅ |
| Embed JotForm forms | ✅ |
| Add GTM & GA | ✅ |
| Add AdWords conversion | ✅ |
| Astro build successful | ✅ |
| Vercel preview deployment | ✅ |
| Redirects configured | ✅ |
| Custom domain on Vercel | ✅ |
| DNS switched to Vercel | ✅ |
| GrowthBook snippet added | ✅ |
| Monitor analytics & logs | 🔄 |

---

## Conclusion

You have successfully migrated your WordPress site to a modern, blazing-fast Astro static site on Vercel while preserving SEO, forms, and analytics. The groundwork for future A/B testing with GrowthBook is in place. Enjoy your new streamlined workflow and performance gains! 🚀 

---

# Recommendation for Astro Project Setup and SEO Migration

The following guidance helps you decide **whether to start with Astro's Vercel adapter immediately or add it later**, and how to preserve SEO authority during the move.

## Using Astro's Vercel Adapter from Day One vs. Adding It Later

### Pros of enabling the adapter early

* **Dynamic-feature readiness** – Pages can opt-in to server-side rendering (SSR) when needed (`export const prerender = false`).
* **Platform perks** – Unlock Vercel-specific enhancements like Image Optimization or Edge Middleware from day one.
* **No future surprise** – Your deployment workflow already supports serverless functions; no refactor required later.

### Cons / why you might wait

* **Extra complexity** – Static sites are simpler and blazingly fast; SSR adds runtime overhead.
* **Cost considerations** – SSR requests consume Vercel serverless invocations (could exceed free tier at scale) whereas static files are essentially free.
* **Performance** – Pre-rendered HTML served from a CDN always wins on TTFB compared to on-demand rendering.

### Pragmatic recommendation

Start **static-first** and switch to *hybrid* or *server* output only when a page truly needs SSR. Installing the adapter early is harmless if you keep `output: 'static'` (or 'hybrid') in `astro.config.mjs`, but it's equally safe to add the adapter later—Astro makes the transition friction-free.

## Performance & Cost: Static vs. SSR

| Factor            | Static (SSG) | SSR via Vercel adapter |
| ----------------- | ------------ | ---------------------- |
| Runtime latency   | ~10-50 ms TTFB (CDN) | 100-300 ms+ (function cold start) |
| Traffic scaling   | Infinite—served from edge cache | Scales automatically but each request runs code |
| Hosting cost      | Near-zero (bandwidth only) | Pay per invocation after free quota |
| Personalization   | Requires client-side JS | First-class, rendered on server |

**Hybrid strategy:** prerender 95 % of pages, SSR only what needs live data (e.g., '/api/*', real-time calendar, auth-gated dashboards). This keeps costs low and UX snappy while enabling future dynamic features.

## Flexibility Benefits of Early Adapter Installation

1. **Incremental adoption** – Convert a single route to SSR at any time without altering the rest of the site.
2. **Serverless API routes** – Files under `src/pages/api/*` become Vercel functions once the adapter is present.
3. **Edge Middleware** – Add geolocation or AB-testing middleware in `/middleware.ts` without additional setup.

If you enable the adapter now, remember to **keep pages static by default** and explicitly disable `prerender` only where necessary.

## SEO Continuity – Preserve Your URL Structure

* **Keep existing permalinks** – Re-create WordPress paths exactly in Astro to avoid rank loss.
* **Use 301s for any changes** – Map every old URL to its new destination in `vercel.json`.
* **Verify with Search Console** – After launch, submit an updated sitemap and watch for crawl errors.

> "The #1 SEO mistake in migrations is failing to preserve URLs." — ZeroGravity Marketing, *SEO Migration Guide*

## Clear Action Plan

1. Launch with Astro in **static output** mode.
2. **Add the Vercel adapter** now (if you want image optimization/Middleware) **or later** (if you prefer minimal deps).
3. When you build dynamic features:
   * Install/enable the adapter (if not already).
   * Mark dynamic pages with `prerender = false`.
   * Deploy—no further infra changes required.
4. Maintain URL parity; configure `vercel.json` redirects for anything that moves.

Following this strategy gives you the best of both worlds: **CDN-fast static pages today, effortless expansion to SSR tomorrow, with zero SEO fallout.** 