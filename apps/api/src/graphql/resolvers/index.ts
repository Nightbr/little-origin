import { mergeResolvers } from '@graphql-tools/merge';
import { authResolvers } from './auth';
import { nameResolvers } from './name';
import { reviewResolvers } from './review';
import { matchResolvers } from './match';
import { preferenceResolvers } from './preference';
import { appResolvers } from './app';

export const resolvers = mergeResolvers([authResolvers, nameResolvers, reviewResolvers, matchResolvers, preferenceResolvers, appResolvers]);
