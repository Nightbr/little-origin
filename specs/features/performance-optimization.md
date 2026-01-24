# Performance Optimization Review & Implementation Plan

## Critical Assessment of TODO.md Points

### Current State
- **Database size**: ~2,511 names (small dataset)
- **Indexes**: Only 2 - `countryIdx` on originCountry, and unique constraint on (name, gender)
- **Caching**: None on server-side; Apollo Client InMemoryCache minimal
- **Query**: `ORDER BY RANDOM()` scans filtered results
- **Preferences**: Fetched from DB on every `getNextNames()` call

---

## Critical Review: What's NOT Worth It

### 1. Pre-shuffled Pool for Random Selection (Priority 1) ❌ SKIP
**Why it's overrated:**
- With only 2,511 records, `ORDER BY RANDOM()` is trivial for SQLite
- This is a solution for millions of records, not thousands
- Adds significant complexity: state tracking, pool refresh logic, user-to-pool mapping, persistence
- Increases memory footprint and code complexity

**Actual bottleneck**: Likely negligible at current scale

### 2. Cache Reviewed Name IDs (Priority 2) ❌ SKIP
**Why it's overrated:**
- The subquery `SELECT nameId FROM reviews WHERE userId = ?` uses an indexed foreign key
- Reviews table is tiny (only grows with user activity)
- Adding Redis/in-memory Set adds deployment complexity
- For a single-user app, this is premature optimization

### 3. Computed `nameLength` Column (Priority 3) ❌ SKIP
**Why it's overrated:**
- `length(name)` calculation on 2,511 rows is negligible (<1ms)
- Requires migration, adds storage, and increases insert complexity
- Only matters if you're filtering by length frequently (you're not)

### 4. Partition Names by Country (Priority 3) ❌ SKIP
**Why it's overrated:**
- TODO admits: "If scaling beyond 100K+ names"
- You're at 2.5K names (2.5% of that threshold)
- Completely unnecessary at current scale

---

## Recommended: High Value, Low Effort

### Priority 0: Measure First ✅ DO FIRST

**Add query performance logging** (TODO Priority 5)
- Log queries taking >100ms
- Use Drizzle's query logging or middleware
- **Effort**: ~10 lines of code
- **Value**: Identify REAL bottlenecks before optimizing hypothetical ones

**File**: `apps/api/src/db/client.ts` - Add query logger

---

### Priority 1: Composite Index ✅ DO

**Add composite index on (gender, originCountry)**
- Every `getNextNames()` query filters by BOTH gender AND country
- Current: `countryIdx` only helps country filtering; gender scans unindexed
- Composite index eliminates full table scan for the WHERE clause

**Effort**: 1 line in schema + migration
**Value**: ~10-100x faster WHERE clause evaluation
**File**: `packages/core/src/db/schema.ts:45-48`

```typescript
// Add to names table definition:
.index('genderCountryIdx', ['gender', 'originCountry'])
```

---

### Priority 2: Cache Preferences ✅ DO

**In-memory LRU cache for user preferences**
- Preferences are fetched on EVERY `getNextNames()` call
- Preferences rarely change (only when user updates them)
- Reduces database hits significantly

**Effort**: ~20 lines using Node's native Map or lru-cache package
**Value**: Eliminates unnecessary DB queries on every card swipe
**Files**:
- `apps/api/src/services/preferences.service.ts` - Add cache layer

---

### Priority 3: Enable WAL Mode ✅ DO

**SQLite WAL (Write-Ahead Logging) mode**
- Allows concurrent reads during writes
- Better throughput for multiple users
- Zero application code changes

**Effort**: 1 line in DB client configuration
**Value**: Better concurrency, zero downside
**File**: `apps/api/src/db/client.ts`

```typescript
// Add to DB connection:
db.run('PRAGMA journal_mode = WAL');
```

---

## Implementation Summary

### Recommended Changes (in order):

1. **Query performance logging** - Measure before optimizing
2. **Composite index on (gender, originCountry)** - Real query speedup
3. **Cache user preferences** - Reduce DB calls
4. **Enable WAL mode** - Better concurrency

### Why These Four?

| Change | Lines of Code | Risk | Performance Impact | Complexity Added |
|--------|--------------|------|-------------------|------------------|
| Query logging | ~10 | None | Measurement only | None |
| Composite index | 1 + migration | None | High (WHERE clause) | None |
| Cache preferences | ~20 | Low | High (eliminates DB call) | Minimal |
| WAL mode | 1 | None | Medium (concurrency) | None |

### What to Avoid:
- ❌ Pre-shuffled pools (over-engineering)
- ❌ Redis for reviewed IDs (adds infrastructure, minimal gain)
- ❌ Computed columns (premature optimization)
- ❌ Partitioning (not needed at 2.5K records)

---

## Files to Modify

1. **`packages/core/src/db/schema.ts`** - Add composite index
2. **`apps/api/src/db/client.ts`** - Add query logging + WAL mode
3. **`apps/api/src/services/preferences.service.ts`** - Add cache layer
4. **`apps/api/src/db/schema/migrations/`** - Generate migration for index

---

## Verification Plan

After implementing:

1. **Run query logging** for 24 hours to capture real usage patterns
2. **Check EXPLAIN QUERY PLAN** for `getNextNames` - verify composite index is used
3. **Measure before/after query times** for `getNextNames` with typical filters
4. **Verify cache hit rate** - preferences should be cached >95% of the time
5. **Concurrent user test** - verify WAL mode allows simultaneous reads/writes

```bash
# Verification commands
cd apps/api
pnpm db:generate  # Generate migration for new index
pnpm db:migrate   # Apply migration

# Check query plan
sqlite3 .data/dev.db "EXPLAIN QUERY PLAN SELECT * FROM names WHERE gender = 'female' AND originCountry = 'US' ORDER BY RANDOM() LIMIT 2;"
```

---

## Conclusion

**Focus on the 4 high-value, low-complexity changes above.** The TODO.md has some good ideas, but many are premature optimizations for your current scale. Measure first, optimize what's actually slow, and keep the platform simple.
