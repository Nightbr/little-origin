import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { env } from './config/env';
import { db } from './db/client';
import { runMigrations } from './db/migrate';
// Schema and Resolvers will be imported here
import { schema } from './graphql/schema';
// Forcing reload to pick up new schema fields
import { getUserFromRequest, getUserFromToken } from './middleware/auth';

async function main() {
	// Ensure database migrations are applied before starting the server
	await runMigrations();

	const app = express();
	const httpServer = createServer(app);

	// WebSocket Server
	const wsServer = new WebSocketServer({
		server: httpServer,
		path: '/graphql',
	});

	// Graphql WS Cleanup Plugin
	const serverCleanup = useServer(
		{
			schema,
			context: async (ctx) => {
				const connectionParams = ctx.connectionParams as { authToken?: string } | undefined;
				const token = connectionParams?.authToken;
				const user = token ? await getUserFromToken(token) : null;
				return { db, user };
			},
		},
		wsServer,
	);

	// Apollo Server
	const server = new ApolloServer({
		schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose();
						},
					};
				},
			},
		],
	});

	await server.start();

	app.use(
		'/graphql',
		cors<cors.CorsRequest>({ origin: true, credentials: true }),
		cookieParser(),
		express.json(),
		expressMiddleware(server, {
			context: async ({ req, res }) => {
				const user = await getUserFromRequest(req);
				return { req, res, db, user };
			},
		}),
	);

	// Serve static files in production (when SERVE_STATIC=true)
	const serveStatic = process.env.SERVE_STATIC === 'true';
	const publicPath = path.join(__dirname, '..', 'public');

	// Health check endpoint (must be before static file serving)
	app.get('/health', (_req, res) => {
		res.status(200).send('OK');
	});

	if (serveStatic && existsSync(publicPath)) {
		console.log(`📁 Serving static files from ${publicPath}`);

		// Serve static assets
		app.use(express.static(publicPath));

		// SPA fallback - serve index.html for all non-API routes
		app.get('*', (_req, res) => {
			res.sendFile(path.join(publicPath, 'index.html'));
		});
	}

	httpServer.listen(env.PORT, () => {
		console.log(`🚀 Server ready at http://localhost:${env.PORT}/graphql`);
		console.log(`🚀 Subscriptions ready at ws://localhost:${env.PORT}/graphql`);
		if (serveStatic) {
			console.log(`🌐 Web app available at http://localhost:${env.PORT}`);
		}
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
