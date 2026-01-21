import type { NextFunction, Request, Response } from 'express';

export function captureResponseBody() {
	return (_req: Request, res: Response, next: NextFunction) => {
		const resWithBody = res as Response & { body?: unknown };

		const originalJson = res.json.bind(res);
		res.json = ((body: unknown) => {
			resWithBody.body = body;
			return originalJson(body as never);
		}) as Response['json'];

		const originalSend = res.send.bind(res);
		res.send = ((body?: unknown) => {
			resWithBody.body = body;
			return originalSend(body as never);
		}) as Response['send'];

		next();
	};
}
