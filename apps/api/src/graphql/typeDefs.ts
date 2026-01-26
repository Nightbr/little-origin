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

  enum IngestionStatus {
    idle
    streaming
    processing
    completed
    failed
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
    familyName: String!
  }

  input UpdatePreferencesInput {
    countryOrigins: [String!]
    genderPreference: GenderPreference
    maxCharacters: Int
    familyName: String
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

  type IngestionProgress {
    country: String!
    totalNames: Int!
    processedNames: Int!
    currentBatch: Int!
    totalBatches: Int!
  }

  type CountryIngestionStatus {
    country: String!
    countryName: String!
    loadedCount: Int!
    isIngesting: Boolean!
    progress: IngestionProgress
    error: String
  }

  type IngestionResult {
    country: String!
    started: Boolean!
  }

  type Query {
    me: User
    allUsers: [User!]!
    nextName: Name
    nextNames(limit: Int, excludeIds: [ID!]): [Name!]!
    likedNames: [Name!]!
    dislikedNames: [Name!]!
    allMatches: [Match!]!
    preferences: UserPreferences!
    appStatus: AppStatus!
    ingestionStatus: [CountryIngestionStatus!]!
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
    deleteUser(userId: ID!): Boolean!
    # Onboarding mutations (no auth required)
    addOnboardingUser(username: String!, password: String!): OnboardingUser!
    saveOnboardingPreferences(input: UpdatePreferencesInput!): UserPreferences!
    completeOnboarding: Boolean!
    # Ingestion mutations
    startIngestion(country: String!): IngestionResult!
  }

  type Subscription {
    matchCreated: Match!
    nameIngestionProgress: IngestionProgress!
  }
`;
