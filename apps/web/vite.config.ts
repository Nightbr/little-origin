import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [TanStackRouterVite(), react()],
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
