import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger';
import { verifyToken } from '../utils/jwt';

const SENSITIVE_BODY_KEYS = [
	'password',
	'token',
	'accesstoken',
	'access_token',
	'refreshtoken',
	'refresh_token',
	'authorization',
	'cookie',
	'set-cookie',
] as readonly string[];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeBody(value: unknown, depth = 0): unknown {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value !== 'object') {
		return value;
	}

	if (depth >= 3) {
		return '[MaxDepth]';
	}

	if (Array.isArray(value)) {
		return value.map((item) => sanitizeBody(item, depth + 1));
	}

	if (!isRecord(value)) {
		return value;
	}

	const result: Record<string, unknown> = {};

	for (const [key, nested] of Object.entries(value)) {
		if (SENSITIVE_BODY_KEYS.includes(key.toLowerCase())) {
			result[key] = '[REDACTED]';
		} else {
			result[key] = sanitizeBody(nested, depth + 1);
		}
	}

	return result;
}

export function createRequestLogger() {
	return pinoHttp({
		logger,
		genReqId: () => randomUUID(),
		wrapSerializers: false,
		serializers: {
			// Log only the most relevant request fields and a sanitized body
			req: (reqRaw) => {
				const req = reqRaw as Request & { id?: string | number };
				const headerWhitelist = [
					'host',
					'user-agent',
					'content-type',
					'content-length',
					'x-request-id',
				];
				const filteredHeaders: Record<string, string | string[]> = {};

				for (const key of headerWhitelist) {
					const value = req.headers[key];
					if (value !== undefined) {
						filteredHeaders[key] = value as string | string[];
					}
				}

				return {
					id: req.id,
					method: req.method,
					url: req.url,
					headers: filteredHeaders,
					body: sanitizeBody(req.body),
				};
			},
			// Log only basic response metadata and the captured (sanitized) body
			res: (resRaw) => {
				const res = resRaw as Response & { body?: unknown };
				const headerWhitelist = ['content-type', 'content-length'];
				const filteredHeaders: Record<string, string | string[]> = {};
				const headers = res.getHeaders();

				for (const key of headerWhitelist) {
					const value = headers[key];
					if (value !== undefined) {
						filteredHeaders[key] = value as string | string[];
					}
				}

				let body: unknown = res.body;

				// Apollo often sends a JSON string body; parse and sanitize it so that
				// sensitive fields like accessToken/refreshToken are never logged.
				if (typeof body === 'string') {
					try {
						const parsed = JSON.parse(body) as unknown;
						body = sanitizeBody(parsed);
					} catch {
						// If parsing fails, avoid logging raw potentially sensitive payload.
						body = '[UNPARSEABLE_BODY]';
					}
				} else {
					body = sanitizeBody(body);
				}

				return {
					statusCode: res.statusCode,
					headers: filteredHeaders,
					body,
				};
			},
		},
		customProps: (req) => {
			const authHeader = req.headers.authorization;
			if (!authHeader) {
				return { auth: { hasToken: false } };
			}

			const token = authHeader.split(' ')[1];
			if (!token) {
				return { auth: { hasToken: false } };
			}

			const payload = verifyToken(token);
			if (!payload) {
				return { auth: { hasToken: true, valid: false } };
			}

			return {
				auth: {
					hasToken: true,
					valid: true,
					userId: payload.userId,
				},
			};
		},
		customLogLevel: (_req, res) => {
			const statusCode = res.statusCode ?? 200;
			if (statusCode >= 500) return 'error';
			if (statusCode >= 400) return 'warn';
			return 'info';
		},
	});
}
