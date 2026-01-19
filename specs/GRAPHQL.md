# GraphQL API Schema

Complete GraphQL API documentation with schema definitions and usage examples.

---

## Overview

**Endpoint:** `http://localhost:3000/graphql`  
**WebSocket:** `ws://localhost:3000/graphql` (for subscriptions)  
**Playground:** Available in development mode

---

## Type Definitions

```graphql
# ============================================================================
# SCALARS
# ============================================================================

scalar DateTime

# ============================================================================
# ENUMS
# ============================================================================

enum Gender {
  MALE
  FEMALE
}

enum GenderPreference {
  MALE
  FEMALE
  BOTH
}

enum NameSource {
  API
  LLM
  SEED
  STATIC
}

# ============================================================================
# TYPES
# ============================================================================

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

type Preferences {
  id: ID!
  countryOrigins: [String!]!
  genderPreference: GenderPreference!
  maxCharacters: Int!
  updatedAt: DateTime!
}

type NamePoolStatus {
  remaining: Int!
  needsRefill: Boolean!
}

type UserReviews {
  user: User!
  likes: [Name!]!
  dislikes: [Name!]!
  likeCount: Int!
  dislikeCount: Int!
}

# ============================================================================
# AUTH
# ============================================================================

type AuthPayload {
  token: String!
  user: User!
}

# ============================================================================
# RESULTS
# ============================================================================

type SeedResult {
  count: Int!
  source: String!
  message: String!
}

# ============================================================================
# INPUTS
# ============================================================================

input UserInput {
  username: String!
  password: String!
}

input PreferencesInput {
  countryOrigins: [String!]!
  genderPreference: GenderPreference!
  maxCharacters: Int!
}

# ============================================================================
# QUERIES
# ============================================================================

type Query {
  # Auth
  me: User
  
  # Users
  userCount: Int!
  
  # Names
  nextName: Name
  namePoolStatus: NamePoolStatus!
  
  # Reviews
  myLikes: [Name!]!
  myDislikes: [Name!]!
  myReviewCount: Int!
  
  # Matches
  matches: [Match!]!
  matchCount: Int!
  
  # All users
  allUsersReviews: [UserReviews!]!
  
  # Preferences
  preferences: Preferences
}

# ============================================================================
# MUTATIONS
# ============================================================================

type Mutation {
  # Auth
  register(username: String!, password: String!): AuthPayload!
  login(username: String!, password: String!): AuthPayload!
  logout: Boolean!
  
  # Onboarding (only when no users exist)
  createUsers(users: [UserInput!]!): [User!]!
  setPreferences(input: PreferencesInput!): Preferences!
  seedNames: SeedResult!
  
  # Reviews
  reviewName(nameId: ID!, isLiked: Boolean!): Review!
  undoLastReview: Review
  
  # Names
  fetchMoreNames: Int!
}

# ============================================================================
# SUBSCRIPTIONS
# ============================================================================

type Subscription {
  matchCreated: Match!
  namePoolStatusChanged: NamePoolStatus!
}
```

---

## Queries

### me

Get current authenticated user.

**Query:**
```graphql
query Me {
  me {
    id
    username
    createdAt
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "id": "1",
      "username": "alice",
      "createdAt": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

### nextName

Get next unreviewd name for current user.

**Query:**
```graphql
query NextName {
  nextName {
    id
    name
    gender
    originCountry
    source
  }
}
```

**Response:**
```json
{
  "data": {
    "nextName": {
      "id": "42",
      "name": "Sophia",
      "gender": "FEMALE",
      "originCountry": "IT",
      "source": "STATIC"
    }
  }
}
```

**Returns `null`** when all names have been reviewed.

---

### myLikes / myDislikes

Get user's liked or disliked names.

**Query:**
```graphql
query MyLikes {
  myLikes {
    id
    name
    gender
    originCountry
  }
}

query MyDislikes {
  myDislikes {
    id
    name
    gender
    originCountry
  }
}
```

---

### matches

Get all matched names (2+ users liked).

**Query:**
```graphql
query Matches {
  matches {
    id
    name {
      id
      name
      gender
      originCountry
    }
    userCount
    likedBy {
      id
      username
    }
    matchedAt
  }
}
```

**Response:**
```json
{
  "data": {
    "matches": [
      {
        "id": "1",
        "name": {
          "id": "42",
          "name": "Olivia",
          "gender": "FEMALE",
          "originCountry": "IT"
        },
        "userCount": 3,
        "likedBy": [
          { "id": "1", "username": "alice" },
          { "id": "2", "username": "bob" },
          { "id": "3", "username": "carol" }
        ],
        "matchedAt": "2024-01-20T12:30:00Z"
      }
    ]
  }
}
```

---

### allUsersReviews

Get all users' likes and dislikes.

**Query:**
```graphql
query AllUsersReviews {
  allUsersReviews {
    user {
      id
      username
    }
    likes {
      id
      name
      gender
    }
    dislikes {
      id
      name
      gender
    }
    likeCount
    dislikeCount
  }
}
```

---

### preferences

Get global app preferences.

**Query:**
```graphql
query Preferences {
  preferences {
    id
    countryOrigins
    genderPreference
    maxCharacters
    updatedAt
  }
}
```

**Response:**
```json
{
  "data": {
    "preferences": {
      "id": "1",
      "countryOrigins": ["US", "IT", "FR"],
      "genderPreference": "BOTH",
      "maxCharacters": 12,
      "updatedAt": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

## Mutations

### register / login

Authenticate user.

**Register:**
```graphql
mutation Register($username: String!, $password: String!) {
  register(username: $username, password: $password) {
    token
    user {
      id
      username
    }
  }
}
```

**Variables:**
```json
{
  "username": "alice",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "data": {
    "register": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "1",
        "username": "alice"
      }
    }
  }
}
```

**Login** uses same schema.

---

### createUsers (Onboarding)

Create multiple users during onboarding.

**Mutation:**
```graphql
mutation CreateUsers($users: [UserInput!]!) {
  createUsers(users: $users) {
    id
    username
    createdAt
  }
}
```

**Variables:**
```json
{
  "users": [
    { "username": "alice", "password": "pass123" },
    { "username": "bob", "password": "pass456" }
  ]
}
```

**Validation:**
- Only works when no users exist
- Maximum 10 users
- Validates username/password requirements

---

### setPreferences

Set global app preferences.

**Mutation:**
```graphql
mutation SetPreferences($input: PreferencesInput!) {
  setPreferences(input: $input) {
    id
    countryOrigins
    genderPreference
    maxCharacters
  }
}
```

**Variables:**
```json
{
  "input": {
    "countryOrigins": ["US", "IT", "FR"],
    "genderPreference": "BOTH",
    "maxCharacters": 12
  }
}
```

---

### seedNames

Populate database with initial names.

**Mutation:**
```graphql
mutation SeedNames {
  seedNames {
    count
    source
    message
  }
}
```

**Response:**
```json
{
  "data": {
    "seedNames": {
      "count": 250,
      "source": "static",
      "message": "Successfully loaded 250 names from static files"
    }
  }
}
```

---

### reviewName

Review a name (swipe left/right).

**Mutation:**
```graphql
mutation ReviewName($nameId: ID!, $isLiked: Boolean!) {
  reviewName(nameId: $nameId, isLiked: $isLiked) {
    id
    name {
      id
      name
    }
    isLiked
    reviewedAt
  }
}
```

**Variables:**
```json
{
  "nameId": "42",
  "isLiked": true
}
```

**Side Effects:**
- Creates/updates match if 2+ users like the name
- Triggers `matchCreated` subscription

---

### undoLastReview

Undo the last review action.

**Mutation:**
```graphql
mutation UndoLastReview {
  undoLastReview {
    id
    name {
      id
      name
    }
    isLiked
  }
}
```

**Returns `null`** if no reviews to undo.

**Side Effects:**
- May delete match if likes drop below 2

---

### fetchMoreNames

Manually trigger name pool refill.

**Mutation:**
```graphql
mutation FetchMoreNames {
  fetchMoreNames
}
```

**Response:**
```json
{
  "data": {
    "fetchMoreNames": 250
  }
}
```

Returns count of new names added.

---

## Subscriptions

### matchCreated

Real-time notification when a match is created.

**Subscription:**
```graphql
subscription OnMatchCreated {
  matchCreated {
    id
    name {
      id
      name
      gender
      originCountry
    }
    userCount
    likedBy {
      id
      username
    }
    matchedAt
  }
}
```

**Event Data:**
```json
{
  "data": {
    "matchCreated": {
      "id": "5",
      "name": {
        "id": "42",
        "name": "Olivia",
        "gender": "FEMALE",
        "originCountry": "IT"
      },
      "userCount": 2,
      "likedBy": [
        { "id": "1", "username": "alice" },
        { "id": "2", "username": "bob" }
      ],
      "matchedAt": "2024-01-20T14:25:00Z"
    }
  }
}
```

---

### namePoolStatusChanged

Alert when name pool is running low.

**Subscription:**
```graphql
subscription OnNamePoolStatus {
  namePoolStatusChanged {
    remaining
    needsRefill
  }
}
```

**Event Data:**
```json
{
  "data": {
    "namePoolStatusChanged": {
      "remaining": 8,
      "needsRefill": true
    }
  }
}
```

---

## Client Usage (Apollo)

### Setup

```typescript
// apps/web/src/lib/apollo-client.ts

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
  credentials: 'include', // Send cookies
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:3000/graphql',
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### Query Example

```typescript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const NEXT_NAME_QUERY = gql`
  query NextName {
    nextName {
      id
      name
      gender
      originCountry
    }
  }
`;

function SwipeView() {
  const { data, loading, error } = useQuery(NEXT_NAME_QUERY);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!data?.nextName) return <NoMoreNames />;
  
  return <SwipeCard name={data.nextName} />;
}
```

### Mutation Example

```typescript
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const REVIEW_NAME_MUTATION = gql`
  mutation ReviewName($nameId: ID!, $isLiked: Boolean!) {
    reviewName(nameId: $nameId, isLiked: $isLiked) {
      id
      isLiked
    }
  }
`;

function SwipeControls({ nameId }: { nameId: string }) {
  const [reviewName] = useMutation(REVIEW_NAME_MUTATION, {
    refetchQueries: ['NextName', 'Matches'],
  });
  
  const handleLike = () => {
    reviewName({ variables: { nameId, isLiked: true } });
  };
  
  const handleDislike = () => {
    reviewName({ variables: { nameId, isLiked: false } });
  };
  
  return (
    <>
      <button onClick={handleDislike}>👎</button>
      <button onClick={handleLike}>👍</button>
    </>
  );
}
```

### Subscription Example

```typescript
import { useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';

const MATCH_CREATED_SUBSCRIPTION = gql`
  subscription OnMatchCreated {
    matchCreated {
      id
      name {
        name
      }
      likedBy {
        username
      }
    }
  }
`;

function MatchNotification() {
  const { data } = useSubscription(MATCH_CREATED_SUBSCRIPTION);
  
  if (!data?.matchCreated) return null;
  
  return (
    <MatchCelebration
      name={data.matchCreated.name.name}
      users={data.matchCreated.likedBy}
    />
  );
}
```

---

## Error Handling

### Standard Error Format

```json
{
  "errors": [
    {
      "message": "Username must be at least 3 characters",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "field": "username"
      }
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED` - Not logged in
- `FORBIDDEN` - Not authorized
- `BAD_USER_INPUT` - Validation error
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate/constraint violation
- `INTERNAL_SERVER_ERROR` - Server error

### Client Error Handling

```typescript
const [reviewName, { error }] = useMutation(REVIEW_NAME_MUTATION);

if (error) {
  if (error.graphQLErrors[0]?.extensions?.code === 'UNAUTHENTICATED') {
    // Redirect to login
  } else if (error.graphQLErrors[0]?.extensions?.code === 'CONFLICT') {
    // Name already reviewed
  } else {
    // Generic error
  }
}
```

---

## Rate Limiting

**Limits:**
- 100 requests per minute per IP
- 10 mutations per minute per user
- Unlimited queries/subscriptions

**Response when rate limited:**
```json
{
  "errors": [
    {
      "message": "Too many requests",
      "extensions": {
        "code": "RATE_LIMIT_EXCEEDED",
        "retryAfter": 60
      }
    }
  ]
}
```

---

## Testing

### GraphQL Playground Queries

```graphql
# Complete onboarding flow
mutation {
  createUsers(users: [
    { username: "alice", password: "pass123" },
    { username: "bob", password: "pass456" }
  ]) {
    id
    username
  }
}

mutation {
  setPreferences(input: {
    countryOrigins: ["US", "IT"],
    genderPreference: BOTH,
    maxCharacters: 12
  }) {
    id
  }
}

mutation {
  seedNames {
    count
    source
  }
}

# Login as Alice
mutation {
  login(username: "alice", password: "pass123") {
    token
  }
}

# Start swiping
query {
  nextName {
    id
    name
  }
}

mutation {
  reviewName(nameId: "1", isLiked: true) {
    id
  }
}
```

---

## Summary

**API Features:**
- ✅ Type-safe GraphQL schema
- ✅ Real-time subscriptions
- ✅ Authentication via JWT
- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting

**Next Steps:**
- See [FEATURES.md](./FEATURES.md) for business logic
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for setup
- See [DATABASE.md](./DATABASE.md) for schema details