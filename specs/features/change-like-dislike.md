# Feature: Change Like/Dislike Decision on Lists

## Overview

Allow users to change their decision (like → dislike or dislike → like) directly from the likes/dislikes lists. This provides a way to correct mistakes or reconsider decisions without needing to swipe through names again.

**User's UX Choices:**
- **Interaction**: Tap card → reveal flip button → tap button → confirmation dialog → change
- **Visual hint**: Hover/active state (already exists: `hover:scale-[1.02]`)
- **Confirmation**: Required before change

---

## Design Decision

**No backend changes needed!**

The existing `reviewName` mutation in `/apps/api/src/services/review.service.ts` already implements **upsert logic**:
- Uses `onConflictDoUpdate` on unique constraint (userId + nameId)
- Automatically triggers match recalculation on any change
- Works for both new reviews AND updating existing reviews

**Rationale**: The database schema and business logic already support changing reviews. We only need to expose this capability in the UI.

---

## Implementation Plan

### Phase 1: Create Shared NameCard Component

**New File:** `apps/web/src/components/lists/NameCard.tsx`

Create a reusable interactive card component:

**Props Interface:**
```typescript
interface NameCardProps {
  name: NameItem;
  familyName: string;
  isLiked: boolean;  // Current state (true for likes, false for dislikes)
}
```

**Features:**
1. **Display**: Name, gender badge, country (matches current design)
2. **First tap**: Reveals "Change Decision" button (flip icon) in card corner
3. **Button tap**: Opens confirmation dialog
4. **Confirm**: Calls `REVIEW_NAME_MUTATION` with opposite `isLiked` value
5. **Cache update**: Removes card from current list (Apollo cache modification)

**State Management:**
```typescript
const [showChangeButton, setShowChangeButton] = useState(false);
const [showDialog, setShowDialog] = useState(false);
```

**Button Design:**
- Position: Absolute, top-right or bottom-right corner
- Icon: `RefreshCw` from lucide-react (flip/rotate metaphor)
- Style: Small circular button, primary color background
- Animation: Fade in + scale up (Framer Motion)
- Z-index: Above card content

---

### Phase 2: Create Confirmation Dialog Component

**New File:** `apps/web/src/components/lists/ChangeDecisionDialog.tsx`

**Props Interface:**
```typescript
interface ChangeDecisionDialogProps {
  isOpen: boolean;
  name: string;
  familyName: string;
  currentIsLiked: boolean;  // Current state for context-aware messaging
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Dialog Content:**
- **Title**: "Change Decision?"
- **Message**: Context-aware based on current state:
  - Likes → Dislike: "Move {name} {familyName} from Likes to Dislikes?"
  - Dislike → Like: "Move {name} {familyName} from Dislikes to Likes?"
- **Confirm Button**: Primary action (e.g., "Yes, Change")
- **Cancel Button**: Secondary action

**Implementation Notes:**
- Use existing dialog component from UI library (shadcn/ui or similar)
- Accessible with proper ARIA attributes
- Mobile-optimized touch targets

---

### Phase 3: Update Likes Route

**File:** `apps/web/src/routes/likes.tsx`

**Changes:**

1. **Import new components:**
```typescript
import { NameCard } from '@/components/lists/NameCard';
import { ChangeDecisionDialog } from '@/components/lists/ChangeDecisionDialog';
import { useMutation } from '@apollo/client';
```

2. **Add mutation with cache update:**
```typescript
const [reviewName] = useMutation(REVIEW_NAME_MUTATION, {
  update: (cache, { data }) => {
    // Remove the changed name from likedNames list
    cache.modify({
      fields: {
        likedNames(existingRefs = [], { readField }) {
          return existingRefs.filter(
            (ref: any) => readField('id', ref) !== changedNameId
          );
        },
      },
    });
  },
  onCompleted: () => {
    // Optional: Show success toast or navigate
  },
});
```

3. **Replace static cards with NameCard:**
```typescript
// Before:
<div className="p-6 bg-white rounded-2xl...">...</div>

// After:
<NameCard
  name={name}
  familyName={familyName}
  isLiked={true}
  onChange={(nameId) => handleNameChange(nameId, name.name)}
/>
```

4. **Add dialog state and handler:**
```typescript
const [selectedName, setSelectedName] = useState<{id: string, name: string} | null>(null);

const handleNameChange = (nameId: string, nameString: string) => {
  setSelectedName({ id: nameId, name: nameString });
};

const handleConfirmChange = () => {
  if (!selectedName) return;
  reviewName({
    variables: {
      nameId: selectedName.id,
      isLiked: false,  // Change to dislike
    },
  });
  setSelectedName(null);
};
```

5. **Render dialog:**
```typescript
<ChangeDecisionDialog
  isOpen={selectedName !== null}
  name={selectedName?.name || ''}
  familyName={familyName}
  currentIsLiked={true}
  onConfirm={handleConfirmChange}
  onCancel={() => setSelectedName(null)}
/>
```

---

### Phase 4: Update Dislikes Route

**File:** `apps/web/src/routes/dislikes.tsx`

**Changes:** Same as likes route, but with:
- `isLiked={false}` for NameCard
- `isLiked: true` for mutation (change to like)
- Context-aware dialog messages for "Dislike → Like"

---

### Phase 5: Add Barrel Export

**New File:** `apps/web/src/components/lists/index.ts`

```typescript
export { NameCard } from './NameCard';
export { ChangeDecisionDialog } from './ChangeDecisionDialog';
```

---

## File Summary

### New Files:

1. **Interactive Card Component:**
   - `apps/web/src/components/lists/NameCard.tsx` - Main card with tap-to-reveal functionality

2. **Confirmation Dialog:**
   - `apps/web/src/components/lists/ChangeDecisionDialog.tsx` - Context-aware confirmation

3. **Barrel Export:**
   - `apps/web/src/components/lists/index.ts` - Clean imports

### Modified Files:

1. **Likes Route:**
   - `apps/web/src/routes/likes.tsx` - Use NameCard, add mutation and dialog

2. **Dislikes Route:**
   - `apps/web/src/routes/dislikes.tsx` - Use NameCard, add mutation and dialog

### No Backend Changes:
- `reviewName` mutation already supports upsert
- Match recalculation already triggers on review change
- WebSocket subscriptions already notify of match changes

---

## Technical Implementation Details

### Mutation and Cache Update Strategy

The key is updating Apollo cache to remove the changed item from the current list:

```typescript
const [reviewName] = useMutation(REVIEW_NAME_MUTATION, {
  update: (cache, { data: { reviewName: review } }) => {
    cache.modify({
      fields: {
        likedNames(existingRefs = [], { readField }) {
          return existingRefs.filter(
            (ref: any) => readField('id', ref) !== review.name.id
          );
        },
        dislikedNames(existingRefs = [], { readField }) {
          return existingRefs.filter(
            (ref: any) => readField('id', ref) !== review.name.id
          );
        },
      },
    });
  },
});
```

This ensures immediate UI update without refetching the entire list.

### NameCard Component Structure

```typescript
export function NameCard({ name, familyName, isLiked }: NameCardProps) {
  const [showChangeButton, setShowChangeButton] = useState(false);

  const handleCardClick = () => {
    setShowChangeButton(true);  // Reveal change button
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Don't trigger card click
    onChange(name.id);    // Trigger parent's change handler
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative p-6 bg-white rounded-2xl border border-border shadow-nurture
                 transition-all hover:scale-[1.02] cursor-pointer"
    >
      {/* Existing content: name, gender, country */}

      {/* Change button - shown on tap */}
      {showChangeButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleButtonClick}
          className="absolute top-4 right-4 p-2 bg-primary text-white rounded-full
                     shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          <RefreshCw size={20} />
        </motion.button>
      )}
    </div>
  );
}
```

### Handling Match Updates

When a user changes:
- **Dislike → Like**: If partner also likes → WebSocket notification → match appears
- **Like → Dislike**: If match existed → deleted (likes < threshold)

Existing WebSocket subscription in `/apps/web/src/graphql/operations.ts` already handles this:

```typescript
export const MATCH_CREATED_SUBSCRIPTION = gql`
  subscription OnMatchCreated {
    matchCreated {
      id
      name { name gender }
      userCount
      likedBy { username }
    }
  }
`;
```

---

## Verification Steps

### 1. Manual Testing - Likes to Dislikes

1. Start app: `pnpm dev`
2. Go to `/likes` route
3. Tap a liked card → flip button appears
4. Tap flip button → confirmation dialog appears
5. Verify dialog message: "Move {name} from Likes to Dislikes?"
6. Tap "Cancel" → dialog closes, card stays
7. Tap flip button again → tap "Confirm"
8. Card removed from likes list
9. Go to `/dislikes` → card appears there
10. Check `/matches` → if match existed, it's removed

### 2. Manual Testing - Dislikes to Likes

1. Go to `/dislikes` route
2. Tap a disliked card → flip button appears
3. Tap flip button → confirmation dialog appears
4. Verify dialog message: "Move {name} from Dislikes to Likes?"
5. Tap "Confirm"
6. Card removed from dislikes list
7. Go to `/likes` → card appears there
8. If partner also likes → match created notification received

### 3. Edge Cases

- **Network error**: Mutation fails → error message shown, card stays in list
- **Empty lists**: Change last item → list becomes empty → empty state shown
- **Rapid taps**: Multiple taps → only one dialog shown
- **Concurrent changes**: Partner changes same name → cache handles gracefully

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter @little-origin/web

# Lint and typecheck
pnpm lint
pnpm typecheck
```

### 5. Add Unit Tests (Optional)

Create test files for new components:
- `apps/web/src/components/lists/__tests__/NameCard.test.tsx`
- `apps/web/src/components/lists/__tests__/ChangeDecisionDialog.test.tsx`

Test coverage:
- Card tap reveals button
- Button tap calls onChange
- Dialog shows correct message based on isLiked
- Confirm/cancel buttons work correctly

---

## User Requirements Confirmed

- **Confirmation required**: Dialog shown before any change
- **Visual hint**: Card scales on hover (existing behavior)
- **Interaction**: Tap → button → dialog → confirm
- **Mobile-first**: Touch targets optimized, accessible
- **Match updates**: Automatic via existing WebSocket subscriptions
- **No backend changes**: Leverage existing `reviewName` upsert logic
