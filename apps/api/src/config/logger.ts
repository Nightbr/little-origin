import pino, { type LoggerOptions } from 'pino';

const isTestEnv = process.env.NODE_ENV === 'test';
const isProdEnv = process.env.NODE_ENV === 'production';

const baseOptions: LoggerOptions = {
	level: process.env.LOG_LEVEL ?? (isTestEnv ? 'silent' : 'info'),
	// Avoid logging sensitive headers such as JWTs and cookies
	redact: {
		paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
		censor: '[REDACTED]',
	},
};

// In non-production environments, enable pretty printing by default for readability
const logger = !isProdEnv
	? pino({
			...baseOptions,
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true,
					singleLine: true,
				},
			},
		})
	: pino(baseOptions);

export { logger };
