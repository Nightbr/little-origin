import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
      context: async (ctx: any) => {
        const token = ctx.connectionParams?.authToken;
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

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${env.PORT}/graphql`);
    console.log(`🚀 Subscriptions ready at ws://localhost:${env.PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
