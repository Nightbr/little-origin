import { mergeResolvers } from '@graphql-tools/merge';
import { authResolvers } from './auth';
import { nameResolvers } from './name';
import { reviewResolvers } from './review';
import { matchResolvers } from './match';
import { preferenceResolvers } from './preference';

export const resolvers = mergeResolvers([authResolvers, nameResolvers, reviewResolvers, matchResolvers, preferenceResolvers]);
