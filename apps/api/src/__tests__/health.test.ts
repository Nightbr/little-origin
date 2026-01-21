import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './test-server';

let app: Express;

beforeAll(async () => {
	app = await createTestApp();
});

describe('Health endpoint', () => {
	it('should respond to /health', async () => {
		const response = await request(app).get('/health');

		expect(response.status).toBe(200);
		expect(response.text).toBe('OK');
	});
});
