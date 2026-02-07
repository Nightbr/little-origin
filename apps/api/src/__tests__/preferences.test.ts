import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	ADD_ONBOARDING_MEMBER_MUTATION,
	GRAPHQL_ENDPOINT,
	LOGIN_MUTATION,
	PREFERENCES_QUERY,
	UPDATE_PREFERENCES_MUTATION,
} from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('GetPreferences Query', () => {
	it('should return preferences with all fields including familyName', async () => {
		const username = 'prefs_test_user';
		const password = 'password123';

		// Create a user
		await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		// Log in
		const loginResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: LOGIN_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		expect(loginResponse.status).toBe(200);
		const token = loginResponse.body.data.login.accessToken as string;

		// Get preferences
		const response = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: PREFERENCES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body.errors).toBeUndefined();

		const prefs = response.body.data.preferences;
		expect(prefs).toBeDefined();
		expect(prefs.familyName).toBeDefined();
		expect(prefs.familyName).toBe('');
		expect(prefs.countryOrigins).toBeDefined();
		expect(Array.isArray(prefs.countryOrigins)).toBe(true);
		expect(prefs.genderPreference).toBeDefined();
		expect(prefs.maxCharacters).toBeDefined();
	});

	it('should return updated familyName after updating preferences', async () => {
		const username = 'prefs_update_test_user';
		const password = 'password123';

		// Create a user
		await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		// Log in
		const loginResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: LOGIN_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		expect(loginResponse.status).toBe(200);
		const token = loginResponse.body.data.login.accessToken as string;

		// Update preferences with a family name
		const updateResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: UPDATE_PREFERENCES_MUTATION,
				variables: {
					input: {
						countryOrigins: ['US'],
						genderPreference: 'both',
						maxCharacters: 15,
						familyName: 'Smith',
					},
				},
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${token}`);

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.data.updatePreferences.familyName).toBe('Smith');

		// Get preferences to verify
		const getResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: PREFERENCES_QUERY })
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${token}`);

		expect(getResponse.status).toBe(200);
		expect(getResponse.body.data.preferences.familyName).toBe('Smith');
	});

	it('should handle empty familyName correctly', async () => {
		const username = 'prefs_empty_test_user';
		const password = 'password123';

		// Create a user
		await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		// Log in
		const loginResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: LOGIN_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		expect(loginResponse.status).toBe(200);
		const token = loginResponse.body.data.login.accessToken as string;

		// Update preferences with empty family name
		const updateResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: UPDATE_PREFERENCES_MUTATION,
				variables: {
					input: {
						countryOrigins: ['US'],
						genderPreference: 'both',
						maxCharacters: 15,
						familyName: '',
					},
				},
			})
			.set('Content-Type', 'application/json')
			.set('Authorization', `Bearer ${token}`);

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.data.updatePreferences.familyName).toBe('');
	});
});
