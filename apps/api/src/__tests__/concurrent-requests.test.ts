import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	ADD_ONBOARDING_MEMBER_MUTATION,
	GRAPHQL_ENDPOINT,
	LIKED_NAMES_QUERY,
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

describe('Request context isolation', () => {
	it('does not mix users when reviewName is called concurrently', async () => {
		const seedResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: SEED_NAMES_MUTATION })
			.set('Content-Type', 'application/json');

		expect(seedResponse.status).toBe(200);

		const userA = 'concurrent_scope_user_a';
		const userB = 'concurrent_scope_user_b';
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

		const [reviewAResponse, reviewBResponse] = await Promise.all([
			request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: REVIEW_NAME_MUTATION,
					variables: { nameId: nameIdForA, isLiked: true },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${userAToken}`),
			request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: REVIEW_NAME_MUTATION,
					variables: { nameId: nameIdForB, isLiked: true },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${userBToken}`),
		]);

		expect(reviewAResponse.status).toBe(200);
		expect(reviewBResponse.status).toBe(200);

		const likedForAResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: LIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userAToken}`);

		expect(likedForAResponse.status).toBe(200);
		const likedNamesForA = (likedForAResponse.body.data.likedNames as { id: string }[]) ?? [];
		const likedIdsForA = likedNamesForA.map((n) => n.id);
		expect(likedIdsForA).toContain(nameIdForA);
		expect(likedIdsForA).not.toContain(nameIdForB);

		const likedForBResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: LIKED_NAMES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${userBToken}`);

		expect(likedForBResponse.status).toBe(200);
		const likedNamesForB = (likedForBResponse.body.data.likedNames as { id: string }[]) ?? [];
		const likedIdsForB = likedNamesForB.map((n) => n.id);
		expect(likedIdsForB).toContain(nameIdForB);
		expect(likedIdsForB).not.toContain(nameIdForA);
	});
});
