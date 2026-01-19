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
    source: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    nextName: Name
    likedNames: [Name!]!
    dislikedNames: [Name!]!
    allMatches: [Match!]!
    preferences: UserPreferences!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    seedNames: SeedResult!
    reviewName(nameId: ID!, isLiked: Boolean!): Review!
    undoLastReview: Review
    updatePreferences(input: UpdatePreferencesInput!): UserPreferences!
  }

  type Subscription {
    matchCreated: Match!
  }
`;
