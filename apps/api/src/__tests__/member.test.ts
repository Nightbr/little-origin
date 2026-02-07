import { appSettings, users } from '@little-origin/core';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { runMigrations } from '../db/migrate';
import {
	ADD_MEMBER_MUTATION,
	ADD_ONBOARDING_MEMBER_MUTATION,
	ALL_USERS_QUERY,
	COMPLETE_ONBOARDING_MUTATION,
	GRAPHQL_ENDPOINT,
	LOGIN_MUTATION,
	ME_QUERY,
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

// Helper function to create a user and log them in, returning the access token
async function createAndLoginUser(username: string, password: string): Promise<string> {
	// Create user via onboarding mutation
	const createUserResponse = await request(app)
		.post(GRAPHQL_ENDPOINT)
		.send({
			query: ADD_ONBOARDING_MEMBER_MUTATION,
			variables: { username, password },
		})
		.set('Content-Type', 'application/json');

	expect(createUserResponse.status).toBe(200);
	expect(createUserResponse.body.data.addOnboardingMember.username).toBe(username);

	// Log in to get access token
	const loginResponse = await request(app)
		.post(GRAPHQL_ENDPOINT)
		.send({
			query: LOGIN_MUTATION,
			variables: { username, password },
		})
		.set('Content-Type', 'application/json');

	expect(loginResponse.status).toBe(200);
	return loginResponse.body.data.login.accessToken as string;
}

describe('Member mutations', () => {
	describe('addMember', () => {
		it('should add a new member when authenticated', async () => {
			const existingUser = 'member_test_existing_user';
			const password = 'password123';
			const token = await createAndLoginUser(existingUser, password);

			// Now use addMember mutation to add a new member
			const newMemberUsername = 'member_test_new_member';
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: newMemberUsername, password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);
			const addMemberData = addMemberResponse.body.data;
			expect(addMemberData.addMember.username).toBe(newMemberUsername);
			expect(addMemberData.addMember).toHaveProperty('id');

			// Verify that the current user session is still the original user
			const meResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: ME_QUERY })
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(meResponse.status).toBe(200);
			expect(meResponse.body.data.me.username).toBe(existingUser);
			expect(meResponse.body.data.me.username).not.toBe(newMemberUsername);
		});

		it('should fail when not authenticated', async () => {
			const newMemberUsername = 'member_test_unauth_member';
			const password = 'password123';

			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: newMemberUsername, password },
				})
				.set('Content-Type', 'application/json');

			expect(addMemberResponse.status).toBe(200);
			expect(addMemberResponse.body.errors).toBeDefined();
			expect(addMemberResponse.body.errors[0].message).toBe('Unauthorized');
		});

		it('should add member without setting new refresh token cookie', async () => {
			const existingUser = 'member_test_cookie_user';
			const password = 'password123';

			// Create and login user - this will set the refresh token cookie
			const token = await createAndLoginUser(existingUser, password);

			// Get the login response to verify the initial cookie was set
			const loginResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: LOGIN_MUTATION,
					variables: { username: existingUser, password },
				})
				.set('Content-Type', 'application/json');

			const initialCookies = loginResponse.headers['set-cookie'];
			expect(initialCookies).toBeDefined();

			// Add a new member
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: 'member_test_cookie_new_member', password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);

			// Verify that no new refresh token cookie was set
			const addMemberCookies = addMemberResponse.headers['set-cookie'];
			expect(addMemberCookies).toBeUndefined();

			// Verify the original user can still make authenticated requests
			const meResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: ME_QUERY })
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(meResponse.status).toBe(200);
			expect(meResponse.body.data.me.username).toBe(existingUser);
		});

		it('should fail when username already exists', async () => {
			const existingUser = 'member_test_duplicate_user';
			const password = 'password123';
			const token = await createAndLoginUser(existingUser, password);

			// Try to add a member with the same username
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: existingUser, password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);
			expect(addMemberResponse.body.errors).toBeDefined();
			expect(addMemberResponse.body.errors[0].message).toBe('Username already taken');
		});

		it('should appear in allUsers query after being added', async () => {
			const existingUser = 'member_test_all_users';
			const password = 'password123';
			const token = await createAndLoginUser(existingUser, password);

			// Get initial user count
			const initialUsersResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: ALL_USERS_QUERY })
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(initialUsersResponse.status).toBe(200);
			const initialCount = initialUsersResponse.body.data.allUsers.length;

			// Add a new member
			const newMemberUsername = 'member_test_all_users_new';
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: newMemberUsername, password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);

			// Verify the new member appears in allUsers
			const finalUsersResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: ALL_USERS_QUERY })
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(finalUsersResponse.status).toBe(200);
			const finalUsers = finalUsersResponse.body.data.allUsers;
			expect(finalUsers).toHaveLength(initialCount + 1);
			expect(finalUsers.some((u: { username: string }) => u.username === newMemberUsername)).toBe(
				true,
			);
		});

		it('should return user data without tokens', async () => {
			const existingUser = 'member_test_no_tokens';
			const password = 'password123';
			const token = await createAndLoginUser(existingUser, password);

			// Add a new member
			const newMemberUsername = 'member_test_no_tokens_new';
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: newMemberUsername, password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);
			const addMemberData = addMemberResponse.body.data.addMember;

			// Verify response contains user data but no tokens
			expect(addMemberData).toHaveProperty('id');
			expect(addMemberData).toHaveProperty('username');
			expect(addMemberData).not.toHaveProperty('accessToken');
			expect(addMemberData).not.toHaveProperty('refreshToken');
		});

		it('should work after onboarding is complete', async () => {
			const username = 'member_after_onboarding_user';
			const password = 'password123';
			const token = await createAndLoginUser(username, password);

			// Complete onboarding
			const completeResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({ query: COMPLETE_ONBOARDING_MUTATION })
				.set('Content-Type', 'application/json');

			expect(completeResponse.status).toBe(200);

			// Now add a member via addMember mutation - should work
			const newMemberUsername = 'member_after_onboarding';
			const addMemberResponse = await request(app)
				.post(GRAPHQL_ENDPOINT)
				.send({
					query: ADD_MEMBER_MUTATION,
					variables: { username: newMemberUsername, password },
				})
				.set('Content-Type', 'application/json')
				.set('Authorization', `Bearer ${token}`);

			expect(addMemberResponse.status).toBe(200);
			const addMemberData = addMemberResponse.body.data;
			expect(addMemberData.addMember.username).toBe(newMemberUsername);
		});
	});
});
