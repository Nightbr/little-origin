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

export const NEXT_NAME_QUERY = gql`
  query NextName {
    nextName {
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

export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
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
    }
  }
`;

export const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdatePreferences($input: UpdatePreferencesInput!) {
    updatePreferences(input: $input) {
      countryOrigins
      genderPreference
      maxCharacters
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

export const ADD_ONBOARDING_USER_MUTATION = gql`
  mutation AddOnboardingUser($username: String!, $password: String!) {
    addOnboardingUser(username: $username, password: $password) {
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
    }
  }
`;

export const COMPLETE_ONBOARDING_MUTATION = gql`
  mutation CompleteOnboarding {
    completeOnboarding
  }
`;
