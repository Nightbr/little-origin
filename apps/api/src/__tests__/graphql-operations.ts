export const GRAPHQL_ENDPOINT = '/graphql';

export const APP_STATUS_QUERY = `#graphql
query AppStatus {
  appStatus {
    hasUsers
    userCount
    isOnboardingComplete
  }
}`;

export const ADD_ONBOARDING_USER_MUTATION = `#graphql
mutation AddOnboardingUser($username: String!, $password: String!) {
  addOnboardingUser(username: $username, password: $password) {
    id
    username
  }
}`;

export const SAVE_ONBOARDING_PREFERENCES_MUTATION = `#graphql
mutation SaveOnboardingPreferences($input: UpdatePreferencesInput!) {
  saveOnboardingPreferences(input: $input) {
    countryOrigins
    genderPreference
    maxCharacters
    familyName
  }
}`;

export const COMPLETE_ONBOARDING_MUTATION = `#graphql
mutation CompleteOnboarding {
  completeOnboarding
}`;

export const REGISTER_MUTATION = `#graphql
mutation Register($username: String!, $password: String!) {
  register(username: $username, password: $password) {
    accessToken
    user {
      id
      username
    }
  }
}`;

export const NEXT_NAME_QUERY = `#graphql
query NextName {
  nextName {
    id
    name
  }
}`;

export const REVIEW_NAME_MUTATION = `#graphql
mutation ReviewName($nameId: ID!, $isLiked: Boolean!) {
  reviewName(nameId: $nameId, isLiked: $isLiked) {
    id
    isLiked
  }
}`;

export const LIKED_NAMES_QUERY = `#graphql
query LikedNames {
  likedNames {
    id
    name
  }
}`;

export const DISLIKED_NAMES_QUERY = `#graphql
query DislikedNames {
  dislikedNames {
    id
    name
  }
}`;

export const SEED_NAMES_MUTATION = `#graphql
mutation SeedNames {
  seedNames {
    count
    total
    source
  }
}`;

export const PREFERENCES_QUERY = `#graphql
query GetPreferences {
  preferences {
    countryOrigins
    genderPreference
    maxCharacters
    familyName
  }
}`;

export const UPDATE_PREFERENCES_MUTATION = `#graphql
mutation UpdatePreferences($input: UpdatePreferencesInput!) {
  updatePreferences(input: $input) {
    countryOrigins
    genderPreference
    maxCharacters
    familyName
  }
}`;
