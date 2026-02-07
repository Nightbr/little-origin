---
sidebar_position: 1
---

![Little Origin Logo](/img/logo.png)

# Welcome to Little Origin

**Little Origin** is a collaborative baby name recommendation app that helps partners find the perfect name together. Built with modern web technologies, it features an intuitive swipe interface, real-time matching, and support for names from around the world.

## What is Little Origin?

Little Origin transforms the often challenging process of choosing a baby name into a delightful, shared experience. Instead of endless spreadsheets or disagreements, you and your partner can:

- **Swipe together** through thousands of baby names from 7 countries
- **Get instant matches** when you both like the same name
- **Filter by preferences** including gender, country, and name characteristics
- **Build your shortlist** of agreed-upon names

## Key Features

### 💝 Intuitive Swiping Interface
- Swipe right to like a name, left to pass
- Familiar, engaging interface inspired by modern dating apps
- Fluid animations powered by Framer Motion

### ✨ Real-time Matching
- Instant notifications when both partners like the same name
- WebSocket-based real-time updates
- Celebrate those moments of agreement together

### 🌍 Global Name Database
- Names from 7 countries across multiple cultures
- Filter by gender, origin, and popularity
- Curated data with accurate origin and meaning information

### 🏠 Self-hosted & Private
- Deploy on your own infrastructure
- Your data stays yours - no third-party tracking
- Full control over your instance

### 🛠️ Easy Deployment
- Single Docker Compose command to get started
- Automatic database migrations
- Health checks and production-ready configuration

## Who is this for?

- **Expectant parents** who want to collaborate on name selection
- **Privacy-conscious users** who want to own their data
- **Open source enthusiasts** who value transparency and control
- **Developers** interested in contributing to a meaningful project

## Tech Stack

Little Origin is built with modern, proven technologies:

- **Frontend:** React, Vite, TanStack Router, Apollo Client, Framer Motion
- **Backend:** Express, Apollo GraphQL, Drizzle ORM
- **Database:** SQLite (easily upgradeable to PostgreSQL)
- **Authentication:** JWT with refresh token rotation, Argon2 password hashing
- **Real-time:** GraphQL WebSocket subscriptions

## What's Next?

- **[Deploy now](/docs/deployment)** - Get Little Origin running with Docker Compose
- **[Configure your instance](/docs/configuration)** - Customize name sources and preferences
- **[Explore features](/docs/features/swiping)** - Learn about swiping, matching, and collaboration
- **[Contribute](/docs/development/contributing)** - Join our community and help improve Little Origin
