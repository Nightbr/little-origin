import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		exclude: ['**/node_modules/**', '**/dist/**'],
		// Run test files sequentially since they share the same in-memory database instance
		fileParallelism: false,
		env: {
			NODE_ENV: 'test',
			JWT_SECRET: 'test-jwt-secret-for-vitest-minimum-10-chars',
			// Use in-memory SQLite database for tests (isolated from production)
			DATABASE_URL: ':memory:',
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@services': path.resolve(__dirname, './src/services'),
			'@graphql': path.resolve(__dirname, './src/graphql'),
		},
	},
	server: {
		deps: {
			inline: true,
		},
	},
});
