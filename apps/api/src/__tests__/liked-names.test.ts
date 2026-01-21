import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	GRAPHQL_ENDPOINT,
	LIKED_NAMES_QUERY,
	NEXT_NAME_QUERY,
	REGISTER_MUTATION,
	REVIEW_NAME_MUTATION,
	SEED_NAMES_MUTATION,
} from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('Liked names scoping', () => {
	it('should return liked names scoped to the current user', async () => {
		const seedResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: SEED_NAMES_MUTATION })
			.set('Content-Type', 'application/json');

		expect(seedResponse.status).toBe(200);

		const userA = 'likes_scope_user_a';
		const userB = 'likes_scope_user_b';
		const password = 'password123';

		const registerAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: REGISTER_MUTATION,
				variables: { username: userA, password },
			})
			.set('Content-Type', 'application/json');

		expect(registerAResponse.status).toBe(200);
		const userAToken = (registerAResponse.body.data.register.accessToken as string) ?? '';

		const registerBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: REGISTER_MUTATION,
				variables: { username: userB, password },
			})
			.set('Content-Type', 'application/json');

		expect(registerBResponse.status).toBe(200);
		const userBToken = (registerBResponse.body.data.register.accessToken as string) ?? '';

		const nextNameForAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: NEXT_NAME_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(nextNameForAResponse.status).toBe(200);
		const nameIdForA = nextNameForAResponse.body.data.nextName.id as string;

		const nextNameForBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: NEXT_NAME_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(nextNameForBResponse.status).toBe(200);
		const nameIdForB = nextNameForBResponse.body.data.nextName.id as string;

		const reviewAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: REVIEW_NAME_MUTATION,
				variables: { nameId: nameIdForA, isLiked: true },
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(reviewAResponse.status).toBe(200);

		const reviewBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: REVIEW_NAME_MUTATION,
				variables: { nameId: nameIdForB, isLiked: true },
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(reviewBResponse.status).toBe(200);

		const likedForAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: LIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(likedForAResponse.status).toBe(200);
		const likedNamesForA = (likedForAResponse.body.data.likedNames as { id: string }[]) ?? [];
		expect(likedNamesForA).toHaveLength(1);
		expect(likedNamesForA[0]?.id).toBe(nameIdForA);

		const likedForBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: LIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(likedForBResponse.status).toBe(200);
		const likedNamesForB = (likedForBResponse.body.data.likedNames as { id: string }[]) ?? [];
		expect(likedNamesForB).toHaveLength(1);
		expect(likedNamesForB[0]?.id).toBe(nameIdForB);
	});
});
