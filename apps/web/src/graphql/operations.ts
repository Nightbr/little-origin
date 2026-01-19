import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
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
      token
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
      token
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
