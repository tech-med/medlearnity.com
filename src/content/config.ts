import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// WordPress migration fields
			tags: z.array(z.string()).optional(),
			categories: z.array(z.string()).optional(),
			// SEO enhancements
			draft: z.boolean().optional(),
		}),
});

const pages = defineCollection({
	// Load Markdown and MDX files in the `src/content/pages/` directory.
	loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			// Transform string to Date object  
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// Pages may have different layouts
			layout: z.string().optional(),
		}),
});

const wpPages = defineCollection({
	// Load Markdown and MDX files in the `src/content/wpPages/` directory.
	loader: glob({ base: './src/content/wpPages', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			// Transform string to Date object  
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// WordPress migration fields
			tags: z.array(z.string()).optional(),
			categories: z.array(z.string()).optional(),
			// SEO enhancements
			draft: z.boolean().optional(),
			// Pages may have different layouts
			layout: z.string().optional(),
		}),
});

export const collections = { blog, pages, wpPages };
