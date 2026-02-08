---
sidebar_position: 2
---

# Real-time Matching

A match occurs when both partners like the same name.

## How Matching Works

### The Match Process

1. **Both Partners Swipe Right** - You and your partner each like a name
2. **Detection** - The system detects mutual interest
3. **Instant Notification** - Both partners receive a match notification
4. **Saved to List** - The name is added to your matches collection

### Real-time Technology

Matches are delivered using WebSocket subscriptions (GraphQL).

## Match Notifications

When a match occurs, you receive an in-app notification.

### Match Information

Each match shows:

- **Baby Name** - The name you both liked
- **Time of Match** - When it happened
- **Number of Users** - How many users liked the name

## Viewing Your Matches

Access all your matches from the matches page in the app.

## Technical Details

### WebSocket Connection

The match system uses GraphQL subscriptions:

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
    matchedAt
  }
}
```

### Match Detection

The system checks for matches by looking for names where multiple users have submitted positive reviews.

## Related Features

- **[Swiping](/docs/features/swiping)** - How to like names and create matches
- **[Names](/docs/features/names)** - Explore the name database

## Next Steps

- **[Start swiping](/docs/features/swiping)** - Begin finding matches
- **[Deploy your instance](/docs/deployment)** - Get Little Origin running
