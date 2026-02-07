# Extended Baby Names CSV Ingestion - Specification

## Overview

Add a hidden "Advanced" menu/page to load extended baby names from large CSV files hosted on GitHub. Features streaming ingestion with real-time progress updates via GraphQL subscriptions.

---

## Feature Specification: Hidden Advanced Menu Access

### User Story

As an administrator, I want to access advanced settings through a hidden gesture so that regular users don't accidentally see administrative features.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| ADV-001 | Hidden activation | Advanced menu item is hidden by default |
| ADV-002 | Tap gesture | 5 taps on "Built with ❤️ for future parents" text reveals Advanced menu |
| ADV-003 | Tap timeout | Tap counter resets after 2 seconds of inactivity |
| ADV-004 | Persistent state | Once revealed, Advanced menu remains visible for the session |
| ADV-005 | Visual feedback | No visual feedback during tapping (prevents hinting) |

### Implementation

**File**: `apps/web/src/components/layout/BurgerMenu.tsx`

- Add `tapCount` and `advancedVisible` state
- Add 2-second timeout to reset tap count
- Make footer text clickable with tap handler
- Dynamically include Advanced item in menuItems array based on `advancedVisible`
- Import `Zap` icon from lucide-react

---

## Feature Specification: Advanced Ingestion Page

### User Story

As an administrator, I want to load extended name datasets per country so that users have access to a larger pool of baby names.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| ING-001 | Country list | Display all 7 supported countries (US, GB, FR, IT, DE, ES, IE) |
| ING-002 | Loaded count | Show count of names already loaded per country |
| ING-003 | Load button | Button to start ingestion for each country |
| ING-004 | Progress bar | Real-time progress during ingestion |
| ING-005 | Batch info | Display current batch / total batches |
| ING-006 | Status indicators | Ready, Processing, Completed, Failed states |
| ING-007 | Retry capability | Show Retry button on failure |
| ING-008 | Disable during active | Button disabled while ingestion is in progress |
| ING-009 | Real-time updates | Progress updates via GraphQL subscription |

### UI Components

**File**: `apps/web/src/routes/advanced.tsx` (NEW)

```typescript
interface ProgressData {
  country: string;
  totalNames: number;
  processedNames: number;
  progressPercentage: number;
  currentBatch: number;
  totalBatches: number;
  status: 'streaming' | 'processing' | 'completed' | 'failed';
  error?: string;
}
```

**Country Card Layout**:

- Country name and loaded count (e.g., "32,308,973 names loaded")
- Status badge (Ready/Processing/Completed/Failed)
- Progress bar (during ingestion)
  - Percentage display
  - Animated fill bar (Framer Motion)
  - Batch counter (e.g., "Batch 15,000 / 33,000")
- Action button (Load Names / Loading... / Retry)

---

## Feature Specification: CSV Streaming Ingestion

### User Story

As the system, I want to stream large CSV files efficiently so that memory usage remains low even with 626MB files.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| CSV-001 | Streaming fetch | Use Node.js `fetch` with `response.body.getReader()` |
| CSV-002 | Line-by-line parsing | Parse CSV line-by-line without loading full file in memory |
| CSV-003 | Batch processing | Insert records in batches of 100 |
| CSV-004 | Data extraction | Extract firstName (col 0) and gender (col 2) from CSV |
| CSV-005 | Gender mapping | Map 'M' → 'male', 'F' → 'female' |
| CSV-006 | Skip malformed | Skip lines with missing data |

### CSV Format

```text
[first name, last name, gender (M/F), country code]
Chelsea,Mitchell,F,US
Brandon,Sylvester,M,US
```

### Implementation

**File**: `apps/api/src/services/ingestion.service.ts` (NEW)

**Constants**:

```typescript
BATCH_SIZE = 100
CSV_BASE_URL = 'https://media.githubusercontent.com/media/Nightbr/little-origin/refs/heads/main/packages/name-data/data/extended-dataset'
```

**Streaming Logic**:

1. Fetch CSV URL with `fetch()`
2. Get `ReadableStream` reader from `response.body`
3. Use `TextDecoder` to decode chunks
4. Split by newline, process complete lines
5. Buffer incomplete line for next chunk
6. Accumulate batches of 100 records
7. Insert batch and emit progress
8. Continue until stream complete

---

## Feature Specification: Deduplication

### User Story

As the system, I want to prevent duplicate names so that the database remains clean and queries remain fast.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| DED-001 | Unique constraint | Leverage existing unique(name, gender) constraint |
| DED-002 | Conflict handling | Use `onConflictDoNothing()` to skip duplicates |

### Implementation

```typescript
await db.insert(names)
  .values(batch.map(b => ({
    name: b.name,
    gender: b.gender,
    originCountry: b.country,
  })))
  .onConflictDoNothing();
```

---

## Feature Specification: Real-time Progress Updates

### User Story

As an administrator, I want to see ingestion progress in real-time so I know the system is working and when it will complete.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| PROG-001 | GraphQL subscription | Real-time updates via WebSocket |
| PROG-002 | Progress payload | Include: country, totalNames, processedNames, progressPercentage, currentBatch, totalBatches, status |
| PROG-003 | Publish frequency | Emit after each batch (100 records) |
| PROG-004 | Status transitions | streaming → processing → completed OR failed |
| PROG-005 | Error notification | Include error message on failure |

### GraphQL Schema

**Types**:

```graphql
enum IngestionStatus {
  idle
  streaming
  processing
  completed
  failed
}

type IngestionProgress {
  totalNames: Int!
  processedNames: Int!
  progressPercentage: Float!
  currentBatch: Int!
  totalBatches: Int!
}

type CountryIngestionStatus {
  country: String!
  countryName: String!
  loadedCount: Int!
  isIngesting: Boolean!
  progress: IngestionProgress
  error: String
}

type IngestionResult {
  country: String!
  started: Boolean!
}
```

**Operations**:

```graphql
extend type Query {
  ingestionStatus: [CountryIngestionStatus!]!
}

extend type Mutation {
  startIngestion(country: String!): IngestionResult!
}

extend type Subscription {
  nameIngestionProgress: IngestionProgress!
}
```

---

## Feature Specification: Ingestion State Management

### User Story

As the system, I want to track active ingestions so that duplicate runs are prevented and status can be queried.

### Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| STATE-001 | In-memory tracking | Use Map to track state per country |
| STATE-002 | Concurrent prevention | Reject start if already ingesting |
| STATE-003 | State cleanup | Clear state 5 seconds after completion/failure |
| STATE-004 | Status query | Return all countries' status in one query |

### State Structure

```typescript
Map<countryCode, {
  totalNames: number;
  processedNames: number;
  currentBatch: number;
  totalBatches: number;
  status: 'streaming' | 'processing' | 'completed' | 'failed';
  error?: string;
}>
```

---

## File Change Summary

### Backend Changes

| File | Type | Changes |
|------|------|---------|
| `apps/api/src/graphql/typeDefs.ts` | Modify | Add enums, types, extend Query/Mutation/Subscription |
| `apps/api/src/graphql/resolvers/ingestion.ts` | Create | New resolvers for Query/Mutation/Subscription |
| `apps/api/src/graphql/resolvers/index.ts` | Modify | Import and merge ingestion resolvers |
| `apps/api/src/services/ingestion.service.ts` | Create | Streaming CSV ingestion service |

### Frontend Changes

| File | Type | Changes |
|------|------|---------|
| `apps/web/src/components/layout/BurgerMenu.tsx` | Modify | Add tap detection and Advanced menu item |
| `apps/web/src/routes/advanced.tsx` | Create | Advanced page with country list and progress |
| `apps/web/src/graphql/operations.ts` | Modify | Add Query/Mutation/Subscription operations |

---

## Testing & Verification

### Backend Tests (GraphQL Playground)

**1. Query Status**:

```graphql
query GetIngestionStatus {
  ingestionStatus {
    country
    countryName
    loadedCount
    isIngesting
  }
}
```

**2. Start Ingestion**:

```graphql
mutation StartIngestion {
  startIngestion(country: "IE") {
    country
    started
  }
}
```

**3. Subscribe to Progress**:

```graphql
subscription OnNameIngestionProgress {
  nameIngestionProgress {
    country
    totalNames
    processedNames
    progressPercentage
    currentBatch
    totalBatches
    status
    error
  }
}
```

### Frontend Tests

1. Start app: `pnpm dev`
2. Login and open menu
3. Tap "Built with ❤️ for future parents" 5 times quickly
4. Verify "Advanced" appears in menu
5. Navigate to `/advanced`
6. Click "Load Names" for Ireland (IE - smallest dataset)
7. Verify progress bar updates
8. Verify completion badge appears
9. Refresh page, verify loaded count increased

### Edge Case Tests

| Test | Expected Result |
|------|-----------------|
| Click Load Names twice | Second click ignored, button stays disabled |
| Run ingestion twice | Duplicates skipped, only new names inserted |
| Disconnect network | Error status shown, Retry button appears |
| Large dataset (US) | Streaming handles 626MB file without memory issues |

### Database Verification

```sql
-- Check names by country
SELECT originCountry, COUNT(*) as count
FROM names
GROUP BY originCountry;

-- Verify no duplicates (should return 0)
SELECT name, gender, COUNT(*) as count
FROM names
GROUP BY name, gender
HAVING count > 1;
```

---

## Performance Considerations

| Aspect | Implementation |
|--------|----------------|
| Memory | Streaming approach - never loads full CSV in memory |
| Database | Batch inserts of 100 records |
| Network | Single fetch per country, streamed response |
| UI | Subscription updates every batch (not every record) |
| Deduplication | Handled by database constraint (efficient) |
| Indexes | Existing indexes on originCountry and gender |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid country code | Returns error, no ingestion started |
| Concurrent ingestion | Returns error "already in progress" |
| Network fetch failure | Emits failed status, clears state after 5s |
| CSV parse error | Skips malformed line, logs error |
| Database error | Continues with next batch, logs error |

---

## Important Notes

1. **Batch Size**: 100 records per batch (matches existing pattern, avoids SQLite limits)
2. **Progress Estimation**: Total count updates as streaming progresses
3. **State Persistence**: In-memory only (cleared on server restart)
4. **Unique Constraint**: Leverages existing unique(name, gender) for automatic deduplication
5. **Total Count**: The system tracks total names per country for display purposes

---

## Future Enhancements (Out of Scope)

- Bulk ingestion (load all countries at once)
- Progress persistence across server restarts
- Ingestion history tracking
- Admin-only access control
- Name validation/filtering during ingestion
- Pause/resume functionality
