---
sidebar_position: 3
---

# Partner Collaboration

Little Origin is designed for two people to explore names together and find matches when you both like the same name.

## Getting Started

### Creating User Accounts

Each person needs their own account:

1. **First User** - Complete onboarding to set up preferences
2. **Additional Users** - Add more users during onboarding or via the members page

### User Accounts

Each user has:
- A unique username
- Their own swipe history
- Access to the shared name pool

## How Collaboration Works

### Shared Name Pool

Both users see the same names:
- Names come from the same database
- Preferences are shared (country, gender filters, max length)

### Individual Activity

Each user swipes independently:
- Your swipes are your own
- Only mutual likes are revealed as matches

### Matches

When both users like the same name:
- The name is added to the matches list
- Both users receive a real-time notification
- The match is visible to all users

## Real-time Updates

### Match Notifications

- Instant notification when a new match occurs
- WebSocket-based real-time delivery
- In-app notification shows the matched name

## Technical Details

### User Management

The system supports multiple users:
- Each user has their own account with username and password
- Users share the same name database and preferences
- Matches are detected when multiple users like the same name

### Real-time Architecture

Collaboration uses:
- GraphQL subscriptions for live match updates
- WebSocket connections for instant notifications

## Privacy

### What's Shared

All users see:
- Matches (names liked by multiple users)
- The total count of users who liked each matched name

### What's Private

Individual users have:
- Their own login credentials
- Their own swipe history

## Related Features

- **[Swiping](/docs/features/swiping)** - Explore names together
- **[Matching](/docs/features/matching)** - Celebrate agreements
- **[Names](/docs/features/names)** - The database you'll explore

## Next Steps

- **[Deploy together](/docs/deployment)** - Set up your shared instance
- **[Start swiping](/docs/features/swiping)** - Begin exploring names
- **[Configure preferences](/docs/configuration)** - Customize your experience
