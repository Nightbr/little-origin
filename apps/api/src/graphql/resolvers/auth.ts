import type { Response } from 'express';
import { authService } from '../../services/auth.service';
import { REFRESH_TOKEN_COOKIE_OPTIONS } from '../../utils/jwt';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

interface GraphQLContext {
  user: { id: number; username: string } | null;
  res: Response;
  req: { cookies: Record<string, string> };
}

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      return context.user; // Populated by middleware
    },
  },
  Mutation: {
    register: async (_: unknown, { username, password }: { username: string; password: string }, context: GraphQLContext) => {
      const { user, tokens } = await authService.register({ username, passwordHash: password });

      // Set refresh token as HTTP-only cookie
      context.res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return { user, accessToken: tokens.accessToken };
    },
    login: async (_: unknown, { username, password }: { username: string; password: string }, context: GraphQLContext) => {
      const { user, tokens } = await authService.login(username, password);

      // Set refresh token as HTTP-only cookie
      context.res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return { user, accessToken: tokens.accessToken };
    },
    logout: async (_: unknown, __: unknown, context: GraphQLContext) => {
      // Clear refresh token cookie
      context.res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/' });
      return true;
    },
    refreshToken: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const refreshToken = context.req.cookies[REFRESH_TOKEN_COOKIE_NAME];

      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      const { user, accessToken } = await authService.refreshAccessToken(refreshToken);
      return { user, accessToken };
    },
  },
};
