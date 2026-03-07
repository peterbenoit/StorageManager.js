// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://storage-manager-js.vercel.app',
	integrations: [
		starlight({
			title: 'StorageManager.js',
			description: 'Feature-rich localStorage/sessionStorage wrapper with expiration, compression, batch operations, and cross-tab event listeners.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/peterbenoit/StorageManager.js' },
			],
			head: [
				{ tag: 'meta', attrs: { name: 'author', content: 'Pete Benoit' } },
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'StorageManager.js' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary' } },
				{ tag: 'meta', attrs: { name: 'twitter:creator', content: '@peterbenoit' } },
				{ tag: 'meta', attrs: { name: 'color-scheme', content: 'light dark' } },
			],
			editLink: {
				baseUrl: 'https://github.com/peterbenoit/StorageManager.js/edit/main/docs/',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Constructor', slug: 'api/constructor' },
						{ label: 'Storage Methods', slug: 'api/storage-methods' },
						{ label: 'Batch Operations', slug: 'api/batch-operations' },
						{ label: 'Event Listeners', slug: 'api/event-listeners' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Basic Usage', slug: 'examples/basic' },
						{ label: 'Advanced Features', slug: 'examples/advanced' },
					],
				},
			],
		}),
	],
});
