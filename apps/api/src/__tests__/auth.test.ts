import { appSettings, users } from '@little-origin/core';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import {
	ADD_ONBOARDING_MEMBER_MUTATION,
	COMPLETE_ONBOARDING_MUTATION,
	GRAPHQL_ENDPOINT,
} from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeEach(async () => {
	// Reset database state before each test
	await runMigrations();

	// Delete all users to reset onboarding state
	await db.delete(users);

	// Reset onboarding status
	await db.delete(appSettings);
});

beforeAll(async () => {
	app = await createTestApp();
});

describe('Onboarding mutations', () => {
	describe('addOnboardingMember', () => {
		it('should work during onboarding phase', async () => {
			const username = 'onboarding_register_test';
			const password = 'password123';

			const response = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_ONBOARDING_MEMBER_MUTATION,
					variables: { username, password },
				})
				.set('Content-Type', 'application/json');

			expect(response.status).toBe(200);
			const data = response.body.data;
			expect(data.addOnboardingMember.username).toBe(username);
			expect(data.addOnboardingMember).toHaveProperty('id');
		});

		it('should fail after onboarding is complete', async () => {
			const username = 'complete_onboarding_user';
			const password = 'password123';

			// Create first user via onboarding
			const createResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_ONBOARDING_MEMBER_MUTATION,
					variables: { username, password },
				})
				.set('Content-Type', 'application/json');

			expect(createResponse.status).toBe(200);

			// Complete onboarding
			const completeResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: COMPLETE_ONBOARDING_MUTATION })
				.set('Content-Type', 'application/json');

			expect(completeResponse.status).toBe(200);
			expect(completeResponse.body.data.completeOnboarding).toBe(true);

			// Now try to add another user via onboarding - should fail
			const secondUserResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_ONBOARDING_MEMBER_MUTATION,
					variables: { username: 'should_fail_onboarding', password },
				})
				.set('Content-Type', 'application/json');

			expect(secondUserResponse.status).toBe(200);
			expect(secondUserResponse.body.errors).toBeDefined();
			expect(secondUserResponse.body.errors[0].message.toLowerCase()).toContain('onboarding');
		});
	});
});
