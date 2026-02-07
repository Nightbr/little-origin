import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	ADD_ONBOARDING_MEMBER_MUTATION,
	COMPLETE_ONBOARDING_MUTATION,
	GRAPHQL_ENDPOINT,
	SAVE_ONBOARDING_PREFERENCES_MUTATION,
} from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('Onboarding flow', () => {
	it('should complete onboarding flow via GraphQL', async () => {
		const username = 'integration_user';
		const password = 'password123';

		const addUserResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: ADD_ONBOARDING_MEMBER_MUTATION,
				variables: { username, password },
			})
			.set('Content-Type', 'application/json');

		expect(addUserResponse.status).toBe(200);
		const addUserData = addUserResponse.body.data;
		expect(addUserData.addOnboardingMember.username).toBe(username);

		const prefsInput = {
			countryOrigins: ['US', 'FR'],
			genderPreference: 'both',
			maxCharacters: 12,
			familyName: '',
		};

		const savePrefsResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({
				query: SAVE_ONBOARDING_PREFERENCES_MUTATION,
				variables: { input: prefsInput },
			})
			.set('Content-Type', 'application/json');

		expect(savePrefsResponse.status).toBe(200);
		const savePrefsData = savePrefsResponse.body.data;
		expect(savePrefsData.saveOnboardingPreferences.countryOrigins).toEqual(
			prefsInput.countryOrigins,
		);
		expect(savePrefsData.saveOnboardingPreferences.familyName).toBe('');

		const completeResponse = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: COMPLETE_ONBOARDING_MUTATION })
			.set('Content-Type', 'application/json');

		expect(completeResponse.status).toBe(200);
		const completeData = completeResponse.body.data;
		expect(completeData.completeOnboarding).toBe(true);
	});
});
