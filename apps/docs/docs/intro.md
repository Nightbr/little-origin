---
sidebar_position: 1
---

![Little Origin Logo](/img/logo.png)

# Welcome to Little Origin

**Little Origin** is a collaborative baby name app that helps partners find names together. Features a swipe interface and real-time matching.

## What is Little Origin?

Little Origin helps you and your partner choose a baby name:

- **Swipe** through baby names from multiple countries
- **Like** names individually and get notified when you both like the same name
- **Filter** by gender, country of origin, and maximum name length

## Key Features

### Swiping Interface
- Swipe right to like a name, left to pass
- Card-based interface with animations

### Real-time Matching
- Instant notification when both partners like the same name
- WebSocket-based real-time updates

### Name Database
- Names from multiple countries
- Filter by gender and country of origin
- Set maximum character length for names

### Self-hosted
- Deploy on your own infrastructure
- Your data stays on your server
- SQLite database (single file)

## Tech Stack

- **Frontend:** React, Vite, TanStack Router, Apollo Client, Framer Motion
- **Backend:** Express, Apollo GraphQL, Drizzle ORM
- **Database:** SQLite
- **Authentication:** JWT with refresh token rotation, Argon2 password hashing
- **Real-time:** GraphQL WebSocket subscriptions

## What's Next?

- **[Deploy now](/docs/deployment)** - Get Little Origin running with Docker Compose
- **[Configure your instance](/docs/configuration)** - Customize name sources and preferences
- **[Explore features](/docs/features/swiping)** - Learn about swiping, matching, and collaboration
- **[Contribute](/docs/development/contributing)** - Join our community and help improve Little Origin
