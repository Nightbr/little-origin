import { users } from '@little-origin/core';
import { db } from '../../db/client';
import { authService } from '../../services/auth.service';
import { matchService } from '../../services/match.service';
import { memberService } from '../../services/member.service';
import { REFRESH_TOKEN_COOKIE_OPTIONS } from '../../utils/jwt';
import type { GraphQLContext } from '../types';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export const authResolvers = {
	Query: {
		me: async (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.user; // Populated by middleware
		},
		allUsers: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return db.select().from(users);
		},
	},
	Mutation: {
		addMember: async (
			_: unknown,
			{ username, password }: { username: string; password: string },
			context: GraphQLContext,
		) => {
			// Must be authenticated to add a member
			if (!context.user) {
				throw new Error('Unauthorized');
			}

			// Create user without generating tokens or setting cookies
			return memberService.addMember(username, password);
		},
		login: async (
			_: unknown,
			{ username, password }: { username: string; password: string },
			context: GraphQLContext,
		) => {
			const { user, tokens } = await authService.login(username, password);

			// Set refresh token as HTTP-only cookie
			context.res.cookie(
				REFRESH_TOKEN_COOKIE_NAME,
				tokens.refreshToken,
				REFRESH_TOKEN_COOKIE_OPTIONS,
			);

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
		deleteUser: async (_: unknown, { userId }: { userId: string }, context: GraphQLContext) => {
			if (!context.user) {
				throw new Error('Unauthorized');
			}

			const targetUserId = Number.parseInt(userId, 10);
			await memberService.deleteUser(targetUserId, context.user.id);
			await matchService.recalculateAllMatches();

			return true;
		},
	},
};
