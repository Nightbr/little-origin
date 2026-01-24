# Little Origin - Feature Backlog

## High Priority (MVP Refinement)

### Preferences & Personalization

- [x] **Family Name Configuration**: Add family name input in preferences
  - Store family name in preferences table
  - Display family name below first name on swipe cards
  - Show full name (first + family) in lists

### Undo & Revert Actions

- [ ] **Revert Last Action**: Undo button for most recent swipe action
- [x] **Revert Likes in List**: Remove names from Liked list directly
- [x] **Revert Dislikes in List**: Remove names from Disliked list directly
- [x] **Match Sync on Revert**: When un-liking a name, update or remove corresponding match

### Filtering & Search

- [ ] **Liked/Disliked List Filters**: Filter by gender and country origin.
- [ ] **Liked/Disliked List Search**: Add search by name functionality.
- [ ] **Matches Filters/Search**: Add filtering and search for the Matches view.

### UI/UX Enhancements

- [ ] **Swipe Card Button Animations**: Animate cards when using like/dislike buttons (not just gestures)
- [ ] **Branding & Visual Identity**:
  - Design and implement logo
  - Refine color palette and typography
  - Consistent icon set
- [ ] **Full UI QA Pass**: Comprehensive review of all screens, interactions, and edge cases

## Names Sourcing

- [ ] More source for names, name loaders with UI. Python script to load more names from the 700k python dataset. <https://pypi.org/project/names-dataset/#full-dataset>
- [ ] **AI Name Sourcing**: Integrate Mastra + Gemini Flash for generative naming.
- [ ] **External APIs**: Fallback to external baby name APIs.

## Future Features

- [ ] **Advanced Filtering**: Filter by meaning, popularity trends.
- [ ] **Multi-language Support**: i18n for the UI.

---

## Performance Optimizations (High Volume Names)

### Priority 1: Critical Query Performance

- [ ] **Replace RANDOM() with pre-shuffled pool**: `ORDER BY RANDOM()` scans the entire table. Instead:
  - Generate a batch of random IDs on server start or periodically
  - Track which IDs have been served to users
  - Refresh the pool when exhausted
  - **Impact**: Eliminates full table scans on every name fetch

- [ ] **Add composite index for common filters**: Create index on `(gender, originCountry)` for optimized filtering
  - Current: Separate indexes don't help when filtering by both
  - Most queries filter by gender AND country together

- [ ] **Add gender index**: Currently missing, but gender is a primary filter

### Priority 2: Caching Layer

- [ ] **Cache user preferences**: Preferences are fetched on every `getNextNames()` call
  - Use in-memory cache (LRU) with TTL
  - Invalidate on update

- [ ] **Cache reviewed name IDs per user**: Avoid subquery on every request
  - Store reviewed IDs in Redis or in-memory Set
  - Invalidate on new review

- [ ] **Pre-fetch next names**: Fetch next batch client-side before user needs them
  - Reduce API calls and perceived latency

### Priority 3: Database Schema Improvements

- [ ] **Add computed `nameLength` column**: Replace `length(name)` calculation
  - Store length as integer column during insertion
  - Index it for fast filtering
  - **Impact**: Eliminates per-row computation

- [ ] **Partition names by country**: If scaling beyond 100K+ names
  - Separate tables per country or use SQLite partial indexes
  - Reduces index size and query scan range

- [ ] **Consider full-text search**: For future search functionality
  - FTS5 virtual table for name search
  - Enable prefix matching and typo tolerance

### Priority 4: Connection & Concurrency

- [ ] **Connection pooling**: Enable WAL mode for SQLite
  - Allows concurrent reads during writes
  - Better throughput for multiple users

- [ ] **Batch review operations**: When user rapidly swipes, batch inserts
  - Buffer reviews client-side, send in batches
  - Reduce database round trips

### Priority 5: Monitoring & Measurement

- [ ] **Add query performance logging**: Track slow queries
  - Log queries taking >100ms
  - Identify regression points

- [ ] **Database size monitoring**: Alert when names table grows
  - Track growth rate and plan scaling

- [ ] **Explain Query Plan analysis**: Regularly review query plans
  - Ensure indexes are being used
  - Catch performance regressions

### Quick Wins (Easy Implementation)

- [ ] **Increase batch size for seeding**: Currently 100, could be 500-1000
- [ ] **Add prepared statement caching**: Drizzle ORM can reuse prepared statements
- [ ] **Optimize `onConflictDoNothing`**: Use `ON CONFLICT DO NOTHING` directly in schema
