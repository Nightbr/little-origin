export const typeDefs = `#graphql
  scalar DateTime

  enum Gender {
    male
    female
  }

  enum GenderPreference {
    male
    female
    both
  }

  enum NameSource {
    api
    llm
    seed
    static
  }

  type User {
    id: ID!
    username: String!
    createdAt: DateTime!
  }

  type Name {
    id: ID!
    name: String!
    gender: Gender!
    originCountry: String!
    source: NameSource!
    createdAt: DateTime!
  }

  type Review {
    id: ID!
    user: User!
    name: Name!
    isLiked: Boolean!
    reviewedAt: DateTime!
  }

  type Match {
    id: ID!
    name: Name!
    userCount: Int!
    likedBy: [User!]!
    matchedAt: DateTime!
  }

  type UserPreferences {
    countryOrigins: [String!]!
    genderPreference: GenderPreference!
    maxCharacters: Int!
  }

  input UpdatePreferencesInput {
    countryOrigins: [String!]
    genderPreference: GenderPreference
    maxCharacters: Int
  }

  type SeedResult {
    count: Int!
    total: Int!
    source: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type RefreshPayload {
    accessToken: String!
    user: User!
  }

  type AppStatus {
    hasUsers: Boolean!
    userCount: Int!
    isOnboardingComplete: Boolean!
  }

  type OnboardingUser {
    id: ID!
    username: String!
  }

  type Query {
    me: User
    allUsers: [User!]!
    nextName: Name
    likedNames: [Name!]!
    dislikedNames: [Name!]!
    allMatches: [Match!]!
    preferences: UserPreferences!
    appStatus: AppStatus!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    logout: Boolean!
    refreshToken: RefreshPayload!
    seedNames: SeedResult!
    reviewName(nameId: ID!, isLiked: Boolean!): Review!
    undoLastReview: Review
    updatePreferences(input: UpdatePreferencesInput!): UserPreferences!
    # Onboarding mutations (no auth required)
    addOnboardingUser(username: String!, password: String!): OnboardingUser!
    saveOnboardingPreferences(input: UpdatePreferencesInput!): UserPreferences!
    completeOnboarding: Boolean!
  }

  type Subscription {
    matchCreated: Match!
  }
`;
