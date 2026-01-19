# Little Origin - Feature Backlog

## High Priority (MVP Refinement)

### Onboarding & User Management

- [ ] **Onboarding Rework**: Redirect to `/onboarding` if no users exist in the database.
- [ ] **Onboarding Step 1**: Interface to add one or more users (partners/family).
- [ ] **Onboarding Step 2**: Configure global preferences (Gender, Countries, Length).
- [ ] **Onboarding Step 3**: Trigger initial name seeding into the database.
- [ ] **Post-Onboarding**: Require login after the onboarding flow is completed.
- [ ] **Add User Flow**: New page/menu entry for logged users to add more family members.

### Web App Performance & State

- [ ] **No-Cache Preferences**: Ensure Preferences query always hits the network (network-only).
- [ ] **No-Cache NextName**: Ensure `getNextName` always hits the network to respect latest preference changes.

### Filtering & Search

- [ ] **Liked/Disliked List Filters**: Filter by gender and country origin.
- [ ] **Liked/Disliked List Search**: Add search by name functionality.
- [ ] **Matches Filters/Search**: Add filtering and search for the Matches view.

### Name Management

- [ ] **Remove Reviews**: Add actions to remove names from Liked/Disliked lists.
- [ ] **Match Sync**: Ensure removing a "Like" updates or removes the corresponding match.

## Infrastructure & DevOps

- [ ] **GitHub Actions CI**: Automated testing on every pull request.
- [ ] **Dockerization**: Create Dockerfile for the full-stack application.
- [ ] **Automated Release**: Build and push Docker images to GitHub Container Registry (GHCR).

## High Priority (Post-MVP)

- [ ] **AI Name Sourcing**: Integrate Mastra + Gemini Flash for generative naming.
- [ ] **External APIs**: Fallback to external baby name APIs.

## Future Features

- [ ] **Advanced Filtering**: Filter by meaning, popularity trends.
- [ ] **Multi-language Support**: i18n for the UI.
