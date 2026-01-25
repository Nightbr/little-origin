import { EVENTS, pubsub } from '../../pubsub';
import { ingestionService } from '../../services/ingestion.service';
import type { GraphQLContext } from '../types';

export const ingestionResolvers = {
	Query: {
		ingestionStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.user) throw new Error('Unauthorized');
			return ingestionService.getIngestionStatus();
		},
	},
	Mutation: {
		startIngestion: async (
			_: unknown,
			{ country }: { country: string },
			context: GraphQLContext,
		) => {
			if (!context.user) throw new Error('Unauthorized');
			return ingestionService.startIngestion(country);
		},
	},
	Subscription: {
		nameIngestionProgress: {
			subscribe: (_: unknown, __: unknown, context: GraphQLContext) => {
				if (!context.user) throw new Error('Unauthorized');
				return pubsub.asyncIterator([EVENTS.NAME_INGESTION_PROGRESS]);
			},
		},
	},
};
