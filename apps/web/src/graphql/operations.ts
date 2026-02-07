import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
    }
  }
`;

export const ALL_USERS_QUERY = gql`
  query AllUsers {
    allUsers {
      id
      username
    }
  }
`;

export const NEXT_NAMES_QUERY = gql`
  query NextNames($limit: Int, $excludeIds: [ID!]) {
    nextNames(limit: $limit, excludeIds: $excludeIds) {
      id
      name
      gender
      originCountry
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      accessToken
      user {
        id
        username
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        id
        username
      }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

export const ADD_MEMBER_MUTATION = gql`
  mutation AddMember($username: String!, $password: String!) {
    addMember(username: $username, password: $password) {
      id
      username
    }
  }
`;

export const REVIEW_NAME_MUTATION = gql`
  mutation ReviewName($nameId: ID!, $isLiked: Boolean!) {
    reviewName(nameId: $nameId, isLiked: $isLiked) {
      id
      isLiked
    }
  }
`;

export const LIKED_NAMES_QUERY = gql`
  query LikedNames {
    likedNames {
      id
      name
      gender
      originCountry
    }
  }
`;

export const DISLIKED_NAMES_QUERY = gql`
  query DislikedNames {
    dislikedNames {
      id
      name
      gender
      originCountry
    }
  }
`;

export const ALL_MATCHES_QUERY = gql`
  query AllMatches {
    allMatches {
      id
      name {
        name
        gender
      }
      userCount
      likedBy {
        username
      }
    }
  }
`;

export const GET_PREFERENCES_QUERY = gql`
  query GetPreferences {
    preferences {
      countryOrigins
      genderPreference
      maxCharacters
      familyName
    }
  }
`;

export const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdatePreferences($input: UpdatePreferencesInput!) {
    updatePreferences(input: $input) {
      countryOrigins
      genderPreference
      maxCharacters
      familyName
    }
  }
`;

export const MATCH_CREATED_SUBSCRIPTION = gql`
  subscription OnMatchCreated {
    matchCreated {
      id
      name {
        name
        gender
      }
      userCount
      likedBy {
        username
      }
    }
  }
`;

// --- ONBOARDING OPERATIONS ---

export const APP_STATUS_QUERY = gql`
  query AppStatus {
    appStatus {
      hasUsers
      userCount
      isOnboardingComplete
    }
  }
`;

export const ADD_ONBOARDING_MEMBER_MUTATION = gql`
  mutation AddOnboardingMember($username: String!, $password: String!) {
    addOnboardingMember(username: $username, password: $password) {
      id
      username
    }
  }
`;

export const SAVE_ONBOARDING_PREFERENCES_MUTATION = gql`
  mutation SaveOnboardingPreferences($input: UpdatePreferencesInput!) {
    saveOnboardingPreferences(input: $input) {
      countryOrigins
      genderPreference
      maxCharacters
      familyName
    }
  }
`;

export const COMPLETE_ONBOARDING_MUTATION = gql`
  mutation CompleteOnboarding {
    completeOnboarding
  }
`;

// --- INGESTION OPERATIONS ---

export const INGESTION_STATUS_QUERY = gql`
  query GetIngestionStatus {
    ingestionStatus {
      country
      countryName
      loadedCount
      isIngesting
      progress {
        country
        totalNames
        processedNames
        currentBatch
        totalBatches
      }
      error
    }
  }
`;

export const START_INGESTION_MUTATION = gql`
  mutation StartIngestion($country: String!) {
    startIngestion(country: $country) {
      country
      started
    }
  }
`;

export const NAME_INGESTION_PROGRESS_SUBSCRIPTION = gql`
  subscription OnNameIngestionProgress {
    nameIngestionProgress {
      country
      totalNames
      processedNames
      currentBatch
      totalBatches
    }
  }
`;

export const PRUNE_EXTENDED_NAMES_MUTATION = gql`
  mutation PruneExtendedNames {
    pruneExtendedNames
  }
`;
