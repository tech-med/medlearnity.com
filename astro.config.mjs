// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: import.meta.env.PUBLIC_SITE_URL || 'https://medlearnity.com',
	integrations: [mdx(), sitemap()],
	// Note: Changing PUBLIC_SITE_URL requires a rebuild for static sites
});
