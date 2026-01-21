import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cookieParser from 'cookie-parser';
import type { CorsRequest } from 'cors';
import cors from 'cors';
import express, { type Express } from 'express';
import { useServer } from 'graphql-ws/lib/use/ws';
import pinoHttp from 'pino-http';
import { WebSocketServer } from 'ws';
import { env } from './config/env';
import { logger } from './config/logger';
import { db } from './db/client';
import { runMigrations } from './db/migrate';
import { schema } from './graphql/schema';
import { getUserFromRequest, getUserFromToken } from './middleware/auth';
import { verifyToken } from './utils/jwt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerSetup {
	app: Express;
	httpServer: ReturnType<typeof createServer>;
}

export async function createHttpServer(): Promise<ServerSetup> {
	await runMigrations();

	const app = express();
	const httpServer = createServer(app);

	const requestLogger = pinoHttp({
		logger,
		genReqId: () => randomUUID(),
		customProps: (req) => {
			const authHeader = req.headers.authorization;
			if (!authHeader) {
				return { auth: { hasToken: false } };
			}

			const token = authHeader.split(' ')[1];
			if (!token) {
				return { auth: { hasToken: false } };
			}

			const payload = verifyToken(token);
			if (!payload) {
				return { auth: { hasToken: true, valid: false } };
			}

			return {
				auth: {
					hasToken: true,
					valid: true,
					userId: payload.userId,
				},
			};
		},
		customLogLevel: (res) => {
			const statusCode = res.statusCode ?? 200;
			if (statusCode >= 500) return 'error';
			if (statusCode >= 400) return 'warn';
			return 'info';
		},
	});

	const wsServer = new WebSocketServer({
		server: httpServer,
		path: '/graphql',
	});

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

	const apolloServer = new ApolloServer({
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

	await apolloServer.start();

	app.use(
		'/graphql',
		// Log only API requests (GraphQL endpoint), not static assets
		requestLogger,
		cors<CorsRequest>({ origin: true, credentials: true }),
		cookieParser(),
		express.json(),
		expressMiddleware(apolloServer, {
			context: async ({ req, res }) => {
				const user = await getUserFromRequest(req);
				return { req, res, db, user };
			},
		}),
	);

	const serveStatic = process.env.SERVE_STATIC === 'true';
	const publicPath = path.join(__dirname, '..', 'public');

	app.get('/health', requestLogger, (_req, res) => {
		res.status(200).send('OK');
	});

	if (serveStatic && existsSync(publicPath)) {
		logger.info({ publicPath }, 'Serving static files');

		app.use(express.static(publicPath));

		app.get('*', (_req, res) => {
			res.sendFile(path.join(publicPath, 'index.html'));
		});
	}

	return { app, httpServer };
}

export function listen(): void {
	createHttpServer()
		.then(({ httpServer }) => {
			httpServer.listen(env.PORT, () => {
				logger.info({ port: env.PORT }, 'Server ready at /graphql');
				logger.info({ port: env.PORT }, 'Subscriptions ready at ws://localhost:%d/graphql');
				if (process.env.SERVE_STATIC === 'true') {
					logger.info({ port: env.PORT }, 'Web app available');
				}
			});
		})
		.catch((error) => {
			logger.error({ err: error }, 'Failed to start server');
			process.exit(1);
		});
}
