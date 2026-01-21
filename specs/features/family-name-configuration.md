# Feature: Family Name Configuration

## Overview

Add a configurable family name that is displayed on swipe cards below the baby name. The family name is shared across the application (stored in preferences) and helps users visualize how full names will look.

## Design Decision

**Where to store family name**: `preferences` table

**Rationale**: This is a baby name app for couples/partners choosing a name together. The family name represents their shared family name that will be combined with potential baby names. It's a shared setting, not per-user.

---

## Implementation Plan

### Phase 1: Database Schema

#### File: `packages/core/src/db/schema.ts`

**Add familyName field to preferences table:**

```typescript
export const preferences = sqliteTable('preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  countryOrigins: text('country_origins', { mode: 'json' }).$type<string[]>().notNull(),
  genderPreference: text('gender_preference', { enum: GENDER_PREF_ENUM }).notNull(),
  maxCharacters: integer('max_characters').notNull(),
  familyName: text('family_name').notNull().default(''),  // NEW FIELD
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Migration required**: Yes - Drizzle will generate a migration to add the new column.

---

### Phase 2: Backend API

#### File: `packages/core/src/constants.ts`

**Update DEFAULT_PREFERENCES:**

```typescript
export const DEFAULT_PREFERENCES = {
  countryOrigins: ['US'] as string[],
  genderPreference: 'both' as const,
  maxCharacters: 20,
  familyName: '',  // NEW: Empty string by default
};
```

#### File: `apps/api/src/graphql/typeDefs.ts`

**Update GraphQL types:**

```graphql
type UserPreferences {
  countryOrigins: [String!]!
  genderPreference: GenderPreference!
  maxCharacters: Int!
  familyName: String!  # NEW FIELD
}

input UpdatePreferencesInput {
  countryOrigins: [String!]
  genderPreference: GenderPreference
  maxCharacters: Int
  familyName: String  # NEW FIELD
}
```

#### File: `apps/web/src/graphql/operations.ts`

**Update GraphQL queries/mutations:**

```typescript
export const GET_PREFERENCES_QUERY = gql`
  query GetPreferences {
    preferences {
      countryOrigins
      genderPreference
      maxCharacters
      familyName  # ADD THIS
    }
  }
`;

export const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdatePreferences($input: UpdatePreferencesInput!) {
    updatePreferences(input: $input) {
      countryOrigins
      genderPreference
      maxCharacters
      familyName  # ADD THIS
    }
  }
`;
```

---

### Phase 3: Frontend - Preferences UI

#### File: `apps/web/src/routes/preferences.tsx`

**Changes needed:**

1. Update `PreferencesFormData` interface:
```typescript
interface PreferencesFormData {
  countryOrigins: string[];
  genderPreference: string;
  maxCharacters: number;
  familyName: string;  // NEW
}
```

2. Add familyName to initial form state:
```typescript
const [formData, setFormData] = useState<PreferencesFormData>({
  countryOrigins: data.preferences.countryOrigins,
  genderPreference: data.preferences.genderPreference,
  maxCharacters: data.preferences.maxCharacters,
  familyName: data.preferences.familyName || '',  // NEW
});
```

3. Add input field in the form (after countryOrigins, before maxCharacters):
```tsx
{/* Family Name Input */}
<div className="mb-6">
  <label className="block text-sm font-medium text-charcoal mb-2">
    Family Name (optional)
  </label>
  <input
    type="text"
    value={formData.familyName}
    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
    placeholder="Enter your family name"
    className="w-full p-3 bg-white/50 rounded-xl border border-border focus:ring-2 focus:ring-sage-green focus:border-transparent"
  />
  <p className="text-xs text-muted-foreground mt-1">
    Will be displayed below names on cards
  </p>
</div>
```

---

### Phase 4: Frontend - Onboarding UI

#### File: `apps/web/src/components/onboarding/PreferencesStep.tsx`

**Changes needed:**

1. Update Preferences interface to include familyName:
```typescript
interface Preferences {
  countryOrigins: string[];
  genderPreference: string;
  maxCharacters: number;
  familyName: string;  // NEW
}
```

2. Add familyName to props and state management
3. Add same input field UI as in preferences.tsx

### Phase 5: Frontend - List Views Display

#### Files to Modify: Liked/Disliked Lists and Matches

The family name should also be displayed in the list views. Need to explore these components:

- `apps/web/src/routes/liked.tsx` - Liked names list
- `apps/web/src/routes/disliked.tsx` - Disliked names list
- `apps/web/src/routes/matches.tsx` - Matches list

**Implementation approach:**

1. Use the same `GET_PREFERENCES_QUERY` to fetch family name
2. Display format: `{firstName} {familyName}` or just `{firstName}` if empty
3. Example update for list items:

```tsx
// In the name display part of list items
<span className="font-medium">
  {review.name.name}
  {familyName && <span className="text-charcoal/70"> {familyName}</span>}
</span>
```

---

### Phase 6: Frontend - Swipe Card Display

#### File: `apps/web/src/components/swipe/SwipeCardContent.tsx`

**Update name display to show family name:**

Current code (lines ~93-95):
```tsx
<h1 className="text-6xl font-heading text-charcoal mb-2 text-center tracking-tight">
  {name.name}
</h1>
```

Updated code:
```tsx
<div className="text-center">
  <h1 className="text-6xl font-heading text-charcoal mb-1 tracking-tight">
    {name.name}
  </h1>
  {familyName && (
    <p className="text-4xl font-medium text-charcoal/70">
      {familyName}
    </p>
  )}
</div>
```

**Pass familyName as prop:**

1. Update component props interface:
```typescript
interface SwipeCardContentProps {
  name: NameData;
  familyName?: string;  // NEW
  onLike: () => void;
  onDislike: () => void;
}
```

2. Update SwipeView.tsx to pass familyName from preferences:
```typescript
// Get family name from preferences query
const { data: prefsData } = useQuery(GET_PREFERENCES_QUERY);
const familyName = prefsData?.preferences?.familyName || '';

// Pass to SwipeCard
<SwipeCard
  name={currentName}
  familyName={familyName}  // NEW
  onLike={handleLike}
  onDislike={handleDislike}
/>
```

---

## File Summary

### Files to Modify:

1. **Database Schema**:
   - `packages/core/src/db/schema.ts` - Add familyName column

2. **Constants**:
   - `packages/core/src/constants.ts` - Update DEFAULT_PREFERENCES

3. **Backend GraphQL**:
   - `apps/api/src/graphql/typeDefs.ts` - Update GraphQL types

4. **Frontend GraphQL**:
   - `apps/web/src/graphql/operations.ts` - Update queries/mutations

5. **Preferences UI**:
   - `apps/web/src/routes/preferences.tsx` - Add input field

6. **Onboarding UI**:
   - `apps/web/src/components/onboarding/PreferencesStep.tsx` - Add input field

7. **List Views**:
   - `apps/web/src/routes/liked.tsx` - Display family name in liked list
   - `apps/web/src/routes/disliked.tsx` - Display family name in disliked list
   - `apps/web/src/routes/matches.tsx` - Display family name in matches

8. **Swipe Card**:
   - `apps/web/src/components/swipe/SwipeCardContent.tsx` - Display family name
   - `apps/web/src/components/swipe/SwipeCard.tsx` - Pass familyName prop
   - `apps/web/src/components/swipe/SwipeView.tsx` - Fetch and pass familyName

---

## Verification Steps

1. **Database Migration**:
   ```bash
   cd apps/api
   pnpm db:generate  # Generates migration with new column
   pnpm db:migrate   # Applies migration
   ```

2. **TypeScript Validation**:
   ```bash
   pnpm typecheck
   ```

3. **Manual Testing**:
   - Start app: `pnpm dev`
   - Complete onboarding with a family name
   - Verify family name appears on swipe cards
   - Go to preferences page and update family name
   - Verify swipe cards reflect updated family name
   - Test with empty family name (should show only first name)
   - Check liked list shows full names
   - Check disliked list shows full names
   - Check matches view shows full names

4. **Edge Cases**:
   - Very long family names
   - Special characters in family name
   - Empty family name (should not display)
   - Updating family name after onboarding

---

## User Requirements Confirmed

- **Optional**: Family name field can be left empty
- **No validation**: Any input is allowed (no length or character restrictions)
- **Display locations**: Swipe cards + liked/disliked lists + matches view
