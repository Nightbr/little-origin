import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { APP_STATUS_QUERY, GRAPHQL_ENDPOINT } from './graphql-operations';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('App status query', () => {
	it('should return initial app status', async () => {
		const response = await request(app)
			.post(GRAPHQL_ENDPOINT)
			.send({ query: APP_STATUS_QUERY })
			.set('Content-Type', 'application/json');

		expect(response.status).toBe(200);
		const data = response.body.data;
		expect(data.appStatus.hasUsers).toBeTypeOf('boolean');
		expect(data.appStatus.userCount).toBeTypeOf('number');
		expect(data.appStatus.isOnboardingComplete).toBeTypeOf('boolean');
	});
});
