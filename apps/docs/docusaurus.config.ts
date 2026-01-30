import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
	title: 'Little Origin',
	tagline: 'Find the perfect name together',
	favicon: 'img/favicon.ico',

	url: 'https://Nightbr.github.io',
	baseUrl: '/little-origin/',
	organizationName: 'Nightbr',
	projectName: 'little-origin',

	onBrokenLinks: 'throw',
	onBrokenAnchors: 'warn',

	markdown: {
		hooks: {
			onBrokenMarkdownLinks: 'warn',
		},
	},

	i18n: {
		defaultLocale: 'en',
		locales: ['en'],
	},

	presets: [
		[
			'classic',
			{
				docs: {
					sidebarPath: './sidebars.ts',
					editUrl: 'https://github.com/Nightbr/little-origin/edit/main/',
				},
				theme: {
					customCss: ['./src/css/custom.css'],
				},
			},
		],
	],

	themeConfig: {
		image: 'img/docusaurus-social-card.jpg',
		navbar: {
			title: 'Little Origin',
			items: [
				{
					type: 'docSidebar',
					sidebarId: 'docsSidebar',
					position: 'left',
					label: 'Docs',
				},
				{
					href: 'https://github.com/Nightbr/little-origin',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Docs',
					items: [
						{ label: 'Introduction', to: '/docs/intro' },
						{ label: 'Deployment', to: '/docs/deployment' },
					],
				},
				{
					title: 'Community',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/Nightbr/little-origin',
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Little Origin. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ['bash', 'typescript', 'tsx', 'yaml'],
		},
	},
};

export default config;
