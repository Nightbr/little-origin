import { AsyncLocalStorage } from 'node:async_hooks';
import type { GraphQLContext } from '../graphql/types';

export interface RequestContextValue {
	user: GraphQLContext['user'];
	requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextValue>();

export function runWithRequestContext<T>(context: RequestContextValue, callback: () => T): T {
	return storage.run(context, callback);
}

export function getRequestContext(): RequestContextValue | undefined {
	return storage.getStore();
}
