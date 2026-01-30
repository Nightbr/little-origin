---
sidebar_position: 3
---

# Partner Collaboration

Little Origin is designed for two people to work together seamlessly. Every feature supports collaboration, from real-time updates to shared decision-making.

## Creating Your Circle

### Partner Accounts

Each person needs their own account:

1. **Sign Up** - Create individual accounts with email and password
2. **Create Circle** - One partner creates a new circle
3. **Invite Partner** - Share the circle code or invite link
4. **Connect** - Both partners are now linked

### Circle Settings

Manage your collaboration:

- **Circle Name** - Give your circle a meaningful name
- **Add Partners** - Invite more than one partner (coming soon)
- **Privacy Settings** - Control who can see your activity
- **Leave Circle** - Exit at any time (data is preserved)

## Real-time Synchronization

### Live Updates

See your partner's activity instantly:

- **Swipes** - Know when your partner is active
- **Matches** - Instant notifications when you both like a name
- **Comments** - See notes and reactions in real-time
- **Presence** - Know when your partner is online

### Conflict Resolution

When you disagree on names:

- **No Pressure** - No obligation to agree
- **See Differences** - Understand each other's preferences
- **Discussion** - Comment and discuss why you liked/disliked
- **Compromise** - Find middle ground together

## Shared Features

### Common Name Pool

Both partners see the same names:

- **Synchronized Deck** - Names appear in the same order
- **Shared Filters** - Apply preferences for both partners
- **Unified Progress** - Track your collective journey

### Individual Activity

Your swipes are your own:

- **Privacy** - Your partner doesn't see every swipe
- **No Pressure** - Swipe independently without judgment
- **Matches Only** - Only mutual likes are revealed

## Communication Tools

### Comments on Names

Leave notes for your partner:

- **Why You Liked It** - Share your reasoning
- **Family Connections** - Mention relatives with the name
- **Concerns** - Note potential issues
- **Ideas** - Suggest middle name combinations

### Reactions

Quick emotional responses:

- ❤️ Love it
- 👍 Good option
- 🤔 Interesting
- 😂 Funny association

### Discussion Threads

In-depth conversations:

- **Threaded Comments** - Keep discussions organized
- **@Mentions** - Get your partner's attention
- **Notifications** - Never miss a message

## Decision Making

### Building Consensus

Move toward agreement:

1. **Explore Independently** - Swipe without pressure
2. **Review Matches** - See where you already agree
3. **Discuss Options** - Use comments to talk through names
4. **Narrow Down** - Focus on top contenders
5. **Final Decision** - Choose together when ready

### Voting System

For groups or family involvement (coming soon):

- **Propose Names** - Suggest options for consideration
- **Vote** - Express preference (yes, no, maybe)
- **Tally Results** - See group sentiment
- **Decisive** - Clear majority wins

## Progress Tracking

### Shared Dashboard

See your collective progress:

- **Total Swipes** - Combined activity
- **Matches Found** - Names you both like
- **Completion Rate** - How much of the database you've covered
- **Time Together** - Duration of your naming journey

### Milestones

Celebrate progress:

- **First Match** - Your first agreed name
- **10 Matches** - Building a solid list
- **50 Matches** - Plenty of great options
- **100 Matches** - Naming superstars

## Privacy in Collaboration

### What's Shared

Your partner sees:

- Matches (names you both like)
- Comments and reactions
- Online status
- General activity level

### What's Private

Your partner doesn't see:

- Individual swipes (unless it's a match)
- Draft comments
- Account details
- Other circles or partners

### Data Control

- **Leave Circle** - Your data stays with you
- **Delete Account** - Remove all your information
- **Export Data** - Download your activity anytime

## Best Practices

### Communication Tips

- **Be Open** - Share your honest opinions
- **Be Kind** - Respect your partner's preferences
- **Explain Yourself** - Help your partner understand your thinking
- **Stay Positive** - This should be fun, not stressful

### Managing Disagreements

When you can't agree:

- **Take a Break** - Step away and return later
- **Compromise** - Consider middle names or variations
- **Keep Exploring** - There are plenty of names out there
- **Remember the Goal** - Finding a name you both love is worth the effort

### Involving Family

Consider including others:

- **Wait Until Later** - Start with just the two of you
- **Family Names** - Honor traditions together
- **Avoid Overwhelm** - Too many opinions can complicate things

## Technical Details

### Circle Association

Users belong to a circle through database relationships:

- One circle has many users
- Each user has one circle
- Reviews are linked to users
- Matches are detected within circles

### Real-time Architecture

Collaboration features use:

- GraphQL subscriptions for live updates
- WebSocket connections for bidirectional communication
- Event-driven architecture for instant notifications
- Optimistic UI updates for responsiveness

## Troubleshooting

### Partner Not Receiving Updates

If your partner isn't seeing your activity:

1. **Check Connection** - Verify both have stable internet
2. **Refresh Page** - Force reconnection to WebSocket
3. **Check Notifications** - Ensure notifications are enabled
4. **Verify Circle** - Confirm you're in the same circle

### Can't See Comments

If comments aren't showing:

1. **Reload Page** - Clear cache and refresh
2. **Check Permissions** - Ensure you're both in the same circle
3. **Network Issues** - Poor connections can delay updates

### Wrong Circle

If you're seeing the wrong partner's activity:

1. **Check Circle Settings** - Verify your circle membership
2. **Contact Support** - There may be an account issue

## Future Enhancements

Planned collaboration improvements:

- [ ] Video calling for live discussion
- [ ] Family involvement features
- [ ] Name ranking and voting
- [ ] Scheduling dedicated naming sessions
- [ ] Name combination suggestions
- [ ] AI-powered compatibility insights

## Related Features

- **[Swiping](/docs/features/swiping)** - Explore names together
- **[Matching](/docs/features/matching)** - Celebrate agreements
- **[Names](/docs/features/names)** - The database you'll explore

## Next Steps

- **[Deploy together](/docs/deployment)** - Set up your shared instance
- **[Start swiping](/docs/features/swiping)** - Begin exploring names
- **[Configure preferences](/docs/configuration)** - Customize your experience
