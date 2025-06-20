import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import astroParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';

export default [
	eslint.configs.recommended,
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'.astro/**',
			'.vercel/**',
			'.env*',
			'package-lock.json',
			'*.log',
		],
	},
	{
		files: ['**/*.js', '**/*.ts', '**/*.astro'],
		languageOptions: {
			globals: {
				URL: 'readonly',
				window: 'readonly',
				document: 'readonly',
			},
		},
	},
	{
		files: ['scripts/**/*.js'],
		languageOptions: {
			globals: {
				console: 'readonly',
				process: 'readonly',
				setTimeout: 'readonly',
				fetch: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				global: 'readonly',
			},
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'no-console': 'off',
		},
	},
	{
		files: ['astro.config.mjs', 'eslint.config.js'],
		languageOptions: {
			globals: {
				process: 'readonly',
				__dirname: 'readonly',
				module: 'readonly',
				require: 'readonly',
			},
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
	{
		files: ['**/*.astro'],
		languageOptions: {
			parser: astroParser,
			parserOptions: {
				parser: tsparser,
				extraFileExtensions: ['.astro'],
			},
		},
		plugins: {
			astro: astroPlugin,
		},
		rules: {
			...astroPlugin.configs.recommended.rules,
		},
	},
];
