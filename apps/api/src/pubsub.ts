import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const EVENTS = {
	MATCH_CREATED: 'MATCH_CREATED',
	NAME_POOL_STATUS: 'NAME_POOL_STATUS',
	NAME_INGESTION_PROGRESS: 'NAME_INGESTION_PROGRESS',
} as const;
