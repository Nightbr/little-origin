---
sidebar_position: 1
---

# Swiping Interface

The swiping interface is the heart of Little Origin. It makes exploring baby names fun, engaging, and collaborative.

## How Swiping Works

### Basic Gestures

- **Swipe Right** (or tap the heart) - Like a name
- **Swipe Left** (or tap the X) - Pass on a name
- **Undo** - Undo your last swipe (limited uses available)

### Card Stack

Names are presented as a stack of cards:

1. **Current Card** - The name you're currently viewing
2. **Background Cards** - Peek at upcoming names
3. **Smooth Animations** - Fluid transitions powered by Framer Motion

### Name Card Information

Each card displays:

- **Baby Name** - Large, readable text
- **Gender** - Male, Female, or Neutral
- **Country of Origin** - Flag icon and country name
- **Year** - When the name was popular
- **Rank** - Popularity ranking (if available)

## Interaction Methods

### Touch / Swipe

On mobile devices or touchscreens:

- Swipe right with your finger to like
- Swipe left with your finger to pass
- The card follows your finger with physics-based animation

### Mouse / Trackpad

On desktop:

- Click and drag to swipe
- Use the on-screen buttons for precision
- Keyboard shortcuts coming soon

### Button Controls

For accessibility and precision:

- **Heart Button** - Like the name
- **X Button** - Pass on the name
- **Undo Button** - Undo last action (limited uses)

## Swipe Physics

The interface uses Framer Motion for realistic, satisfying swipe physics:

- **Velocity Sensitivity** - Faster swipes have more momentum
- **Spring Animation** - Cards snap back or fly away naturally
- **Haptic Feedback** - Tactile response on supported devices

## Preferences & Filtering

Before you start swiping, configure your preferences:

### Country Selection

Choose which countries' names to include:

- United States
- United Kingdom
- France
- Spain
- Germany
- Italy
- Brazil

Select multiple countries to explore diverse naming traditions.

### Gender Filter

Filter names by gender:

- **Male** - Traditionally male names
- **Female** - Traditionally female names
- **Neutral** - Gender-neutral names
- **All** - Show names from all categories

### Advanced Filters

Filter by:

- **Starting Letter** - Names starting with specific letters
- **Length** - Short, medium, or long names
- **Popularity** - Top ranked, trending, or unique names

## Match Detection

When both partners swipe right on the same name, it's a **match**!

- **Instant Notification** - Real-time match notification
- **Celebration Screen** - Special animation when you match
- **Saved to List** - Automatically added to your matches list

See [Matching](/docs/features/matching) for more details on the match system.

## Your Activity History

All your swipes are saved:

- **Liked Names** - Names you swiped right on
- **Passed Names** - Names you swiped left on
- **View History** - See names you've already seen

This helps prevent showing the same name twice and allows you to review your preferences.

## Tips for Better Swiping

### Be Open-Minded

- Don't dismiss names too quickly
- Consider different cultural origins
- Try names you wouldn't normally consider

### Collaborate

- Discuss your swipes with your partner
- Share your thoughts on specific names
- Use matches as a starting point for conversation

### Take Breaks

- Name fatigue is real
- Step away and come back later
- The app remembers your progress

## Accessibility

The swiping interface is designed to be accessible to everyone:

- **Keyboard Navigation** - Full keyboard support coming soon
- **Screen Reader Support** - Cards are fully labeled
- **High Contrast Mode** - Improved visibility options
- **Reduced Motion** - Disable animations if preferred

## Performance

The interface is optimized for smooth performance:

- **60 FPS Animations** - Consistent frame rate
- **Lazy Loading** - Names load as you need them
- **Efficient Rendering** - Optimized React components
- **Offline Capable** - Works without internet (after initial load)

## Future Enhancements

Planned improvements to the swiping interface:

- [ ] Keyboard shortcuts
- [ ] Bulk swipe actions
- [ ] Favorite name highlighting
- [ ] Name pronunciation audio
- [ ] Name meaning preview
- [ ] Advanced filtering options

## Related Features

- **[Matching](/docs/features/matching)** - Learn how matches are detected
- **[Collaboration](/docs/features/collaboration)** - Work together with your partner
- **[Names](/docs/features/names)** - Understand the name database

## Troubleshooting

### Cards Not Responding

If swipes aren't registering:

1. Refresh the page
2. Check your internet connection
3. Try using button controls instead

### Stuck on Same Name

If you see the same name repeatedly:

1. Check your filters - they might be too restrictive
2. You may have seen all available names
3. Try expanding your country or gender selection

### Undo Not Working

Undo has limited uses to prevent abuse. Check how many undo credits you have remaining.

## Next Steps

- **[Learn about matching](/docs/features/matching)** - Understand how matches work
- **[Explore collaboration](/docs/features/collaboration)** - Work with your partner
- **[Deploy your instance](/docs/deployment)** - Get started with Little Origin
