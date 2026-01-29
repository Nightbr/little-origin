import fs from 'node:fs';
import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		TanStackRouterVite(),
		react(),
		{
			name: 'sourcemap-exclude',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.endsWith('.map')) {
						const url = req.url.split('?')[0];
						const root = server.config.root;

						const filePath = path.join(root, url);
						const publicPath = path.join(root, 'public', url);

						if (fs.existsSync(filePath) || fs.existsSync(publicPath)) {
							next();
							return;
						}

						res.setHeader('Content-Type', 'application/json');
						res.end('{"version":3,"sources":[],"mappings":""}');
					} else {
						next();
					}
				});
			},
		},
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@components': path.resolve(__dirname, './src/components'),
			'@hooks': path.resolve(__dirname, './src/hooks'),
			'@lib': path.resolve(__dirname, './src/lib'),
			'@graphql': path.resolve(__dirname, './src/graphql'),
		},
	},
	server: {
		port: 3001,
		proxy: {
			'/graphql': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				ws: true, // Enable WebSocket proxying
			},
		},
	},
});
