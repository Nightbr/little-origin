import { mergeResolvers } from '@graphql-tools/merge';
import { appResolvers } from './app';
import { authResolvers } from './auth';
import { matchResolvers } from './match';
import { nameResolvers } from './name';
import { preferenceResolvers } from './preference';
import { reviewResolvers } from './review';

export const resolvers = mergeResolvers([
	authResolvers,
	nameResolvers,
	reviewResolvers,
	matchResolvers,
	preferenceResolvers,
	appResolvers,
]);
