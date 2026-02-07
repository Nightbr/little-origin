import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	ADD_ONBOARDING_MEMBER_MUTATION,
	DISLIKED_NAMES_QUERY,
	GRAPHQL_ENDPOINT,
	LOGIN_MUTATION,
	NEXT_NAME_QUERY,
	REVIEW_NAME_MUTATION,
	SEED_NAMES_MUTATION,
} from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('Disliked names scoping', () => {
	it('should return disliked names scoped to the current user', async () => {
		const seedResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: SEED_NAMES_MUTATION })
			.set('Content-Type', 'application/json');

		expect(seedResponse.status).toBe(200);

		const userA = 'dislikes_scope_user_a';
		const userB = 'dislikes_scope_user_b';
		const password = 'password123';

		// Create and login user A
		await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username: userA, password },
			})
			.set('Content-Type', 'application/json');

		const loginAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: LOGIN_MUTATION,
				variables: { username: userA, password },
			})
			.set('Content-Type', 'application/json');

		expect(loginAResponse.status).toBe(200);
		const userAToken = loginAResponse.body.data.login.accessToken as string;

		// Create and login user B
		await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username: userB, password },
			})
			.set('Content-Type', 'application/json');

		const loginBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: LOGIN_MUTATION,
				variables: { username: userB, password },
			})
			.set('Content-Type', 'application/json');

		expect(loginBResponse.status).toBe(200);
		const userBToken = loginBResponse.body.data.login.accessToken as string;

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
				variables: { nameId: nameIdForA, isLiked: false },
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(reviewAResponse.status).toBe(200);

		const reviewBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: REVIEW_NAME_MUTATION,
				variables: { nameId: nameIdForB, isLiked: false },
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(reviewBResponse.status).toBe(200);

		const dislikedForAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: DISLIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(dislikedForAResponse.status).toBe(200);
		const dislikedNamesForA =
			(dislikedForAResponse.body.data.dislikedNames as { id: string }[]) ?? [];
		expect(dislikedNamesForA).toHaveLength(1);
		expect(dislikedNamesForA[0]?.id).toBe(nameIdForA);

		const dislikedForBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: DISLIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(dislikedForBResponse.status).toBe(200);
		const dislikedNamesForB =
			(dislikedForBResponse.body.data.dislikedNames as { id: string }[]) ?? [];
		expect(dislikedNamesForB).toHaveLength(1);
		expect(dislikedNamesForB[0]?.id).toBe(nameIdForB);
	});
});
