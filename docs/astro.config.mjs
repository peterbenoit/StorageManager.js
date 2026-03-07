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
				// Favicons
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#10B981' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				{ tag: 'meta', attrs: { name: 'msapplication-TileColor', content: '#10B981' } },
				{ tag: 'meta', attrs: { name: 'msapplication-config', content: '/browserconfig.xml' } },
				{ tag: 'meta', attrs: { name: 'theme-color', content: '#10B981' } },
				// Author and metadata
				{ tag: 'meta', attrs: { name: 'author', content: 'Pete Benoit' } },
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'StorageManager.js' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: '/og-image.jpg' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: '/og-image.jpg' } },
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
