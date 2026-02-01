import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
	docsSidebar: [
		{
			type: 'category',
			label: 'Getting Started',
			collapsed: false,
			items: ['intro', 'deployment', 'deployment/updating', 'configuration'],
		},
		{
			type: 'category',
			label: 'Features',
			collapsed: false,
			items: ['features/swiping', 'features/matching', 'features/collaboration', 'features/names'],
		},
		{
			type: 'category',
			label: 'Development',
			collapsed: false,
			items: ['development/setup', 'development/architecture', 'development/contributing'],
		},
	],
};

export default sidebars;
