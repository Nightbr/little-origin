---
sidebar_position: 2
---

# Real-time Matching

Matching is the magical moment when both partners like the same name. Little Origin makes these moments special with instant notifications and celebration.

## How Matching Works

### The Match Process

1. **Both Partners Swipe Right** - You and your partner each like a name
2. **Detection** - The system detects mutual interest
3. **Instant Notification** - Both partners receive a match notification
4. **Celebration** - Special animation marks the occasion
5. **Saved to List** - The name is added to your matches collection

### Real-time Technology

Matches are delivered instantly using **WebSocket subscriptions**:

- GraphQL subscriptions for real-time updates
- Automatic reconnection on network changes
- Token-based authentication for secure connections
- Bi-directional communication for instant updates

## Match Notifications

### When You Match

When a match occurs:

- **Push Notification** - Alert on your device (if enabled)
- **In-App Animation** - Special celebration screen
- **Sound Effect** - Pleasant audio cue (optional)
- **Haptic Feedback** - Tactile vibration on supported devices

### Match Information

Each match shows:

- **Baby Name** - The name you both liked
- **Time of Match** - When it happened
- **Who Liked First** - See who discovered it first
- **Name Details** - Origin, meaning, and popularity

## Viewing Your Matches

### Matches List

Access all your matches in one place:

- **Chronological Order** - Most recent matches first
- **Searchable** - Find specific matches
- **Filterable** - Sort by name, date, or origin
- **Exportable** - Download your matches list

### Match Details

Tap any match to see:

- Full name information
- When both partners liked it
- Name meaning and origin
- Similar name suggestions

## Match Statistics

Track your naming journey:

- **Total Matches** - How many names you've agreed on
- **Match Rate** - Percentage of swipes that result in matches
- **Recent Activity** - Your latest matches
- **Breakdown by Origin** - See which countries' names match most

## Collaboration Features

### Discussing Matches

When you get a match:

- **Comment System** - Leave notes for your partner
- **Reaction Emojis** - Quick emotional responses
- **Favorite Matches** - Mark your top contenders
- **Share** - Share matches outside the app (optional)

### Building Your Shortlist

Use matches to create your final list:

- **Rank Matches** - Order your top choices
- **Add Notes** - Remember why you liked it
- **Compare Names** - See matches side-by-side
- **Final Selection** - Narrow down to the winner

## Privacy & Security

### Match Visibility

- **Private** - Only you and your partner see your matches
- **Secure** - Encrypted transmission and storage
- **Local Control** - Data stays on your instance

### No Third-Party Sharing

Unlike consumer apps, Little Origin doesn't:

- Share your data with advertisers
- Sell your preferences to third parties
- Track your behavior across apps
- Use your data for training AI models

## Technical Details

### WebSocket Connection

The match system uses GraphQL subscriptions:

```graphql
subscription OnMatch {
  match {
    id
    name {
      id
      name
      gender
      country
    }
    createdAt
    users {
      id
      username
    }
  }
}
```

### Match Detection Algorithm

The system checks for matches efficiently:

- **Database Query** - Optimized join queries
- **Real-time Check** - Immediate detection on swipe
- **Deduplication** - Prevent duplicate match notifications
- **Transactional** - Reliable, atomic operations

### Scaling Considerations

For multiple concurrent users:

- **Connection Pooling** - Efficient database connections
- **Pub/Sub Pattern** - Scalable message distribution
- **Load Balancing** - Horizontal scaling capability
- **Caching** - Reduced database load

## Troubleshooting

### Not Receiving Match Notifications

If matches aren't showing up:

1. **Check Connection** - Verify WebSocket is connected
2. **Refresh Page** - Force reconnection
3. **Check Partner's Activity** - Confirm they're also swiping
4. **Verify Filters** - Ensure you have overlapping preferences

### Delayed Notifications

If notifications are slow:

1. **Check Network** - Slow connections cause delays
2. **Server Load** - High traffic may slow processing
3. **Browser Background** - Some browsers throttle background tabs

### Duplicate Matches

Seeing the same match multiple times:

1. **Known Issue** - Occasionally happens during reconnection
2. **Auto-Resolved** - System deduplicates automatically
3. **Report It** - Let us know if it persists

## Future Enhancements

Planned improvements to matching:

- [ ] Match predictions and suggestions
- [ ] Name compatibility scoring
- [ ] Family name combination testing
- [ ] Social sharing features
- [ ] Match anniversaries and celebrations
- [ ] Advanced statistics and insights

## Related Features

- **[Swiping](/docs/features/swiping)** - How to like names and create matches
- **[Collaboration](/docs/features/collaboration)** - Work together with your partner
- **[Names](/docs/features/names)** - Explore the name database

## Next Steps

- **[Start swiping](/docs/features/swiping)** - Begin finding matches
- **[Deploy your instance](/docs/deployment)** - Get Little Origin running
- **[Configure preferences](/docs/configuration)** - Customize your experience
