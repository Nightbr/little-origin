# Feature: Loading States for All Actions

## Overview

Implement loading states for all GraphQL mutations and actions that are currently missing visual feedback. This improves user experience by preventing double-submissions and providing clear feedback during network operations.

**Current State:**
- Some mutations have loading states (UserStep, add-user, preferences, NameCard)
- Some mutations are missing loading states (Login, Onboarding Next button)
- Swipe actions use optimistic UI (silent mutation) - this is intentional and optimal

**Design Philosophy:**
- Follow existing patterns - no new reusable components needed
- Consistent with brand colors and animations
- Minimal changes for maximum UX improvement

---

## Audit: Missing Loading States

### 1. Login Button (HIGH PRIORITY)
- **Location:** [apps/web/src/components/auth/Login.tsx](apps/web/src/components/auth/Login.tsx#L50-L55)
- **Issue:** Submit button shows no loading state during authentication
- **Impact:** Users may click multiple times, no feedback during network delay
- **Reference Pattern:** [UserStep.tsx:85-102](apps/web/src/components/onboarding/UserStep.tsx#L85-L102)

### 2. ChangeDecisionDialog Confirm Button (MEDIUM PRIORITY)
- **Location:** [apps/web/src/components/lists/ChangeDecisionDialog.tsx](apps/web/src/components/lists/ChangeDecisionDialog.tsx#L78-L84)
- **Issue:** Confirm button has no loading state when changing name decision
- **Impact:** Users may click multiple times, no feedback during network delay
- **Related:** NameCard has `isChanging` state but doesn't pass it to dialog
- **Reference Pattern:** [preferences.tsx:171-201](apps/web/src/routes/preferences.tsx#L171-L201)

### 3. Onboarding "Next" Button (MEDIUM PRIORITY)

- **Location:** [apps/web/src/components/onboarding/OnboardingWizard.tsx](apps/web/src/components/onboarding/OnboardingWizard.tsx#L153-L166)
- **Issue:** Silent save when transitioning from Step 2 → Step 3, no loading feedback
- **Impact:** Users may click multiple times thinking nothing happened
- **Reference Pattern:** [add-user.tsx:123-140](apps/web/src/routes/add-user.tsx#L123-L140)

### 4. DeleteUserDialog Confirm Button (MEDIUM PRIORITY)

- **Location:** [apps/web/src/components/lists/DeleteUserDialog.tsx](apps/web/src/components/lists/DeleteUserDialog.tsx#L81-L87)
- **Parent:** [apps/web/src/routes/add-user.tsx](apps/web/src/routes/add-user.tsx#L64-L84)
- **Issue:** Delete button has no loading state when removing a user
- **Impact:** Users may click multiple times, no feedback during network delay
- **Related:** Parent component `handleDeleteConfirm` doesn't track loading state
- **Reference Pattern:** ChangeDecisionDialog implementation (see Phase 2 below)

### 5. Swipe Review Mutation (NO CHANGES - ALREADY OPTIMAL)
- **Location:** [apps/web/src/components/swipe/SwipeView.tsx](apps/web/src/components/swipe/SwipeView.tsx#L162-L171)
- **Current State:** Silent background mutation with optimistic UI
- **Decision:** Keep current implementation - follows best practices for swipe interfaces
- **Rationale:**
  - Optimistic UI (card disappears immediately on swipe)
  - Queue system prevents duplicate submissions
  - 60fps animations without UI blocking
  - Matches modern app UX (Tinder, Instagram, etc.)

---

## Implementation Plan

### Phase 1: Login Component

#### File: `apps/web/src/components/auth/Login.tsx`

**Changes:**

1. **Add loading state** (after line 10):
```tsx
const [loading, setLoading] = useState(false);
```

2. **Update handleSubmit to manage loading** (lines 12-20):

```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');
    try {
        await login(username, password);
        router.navigate({ to: '/' });
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
        setLoading(false);
    }
};
```

3. **Update button to show loading state** (lines 50-55):
```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');
    try {
        await login(username, password);
        router.navigate({ to: '/' });
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
        setLoading(false);
    }
};
```

3. **Update button to show loading state** (lines 50-55):

```tsx
<button
    type="submit"
    disabled={loading || !username || !password}
    className={`w-full py-3 px-4 bg-primary text-white font-heading font-semibold rounded-xl hover:bg-primary/90 shadow-nurture transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
        loading || !username || !password ? 'opacity-50 cursor-not-allowed' : ''
    }`}
>
    {loading ? (
        <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing in...
        </>
    ) : (
        'Sign In'
    )}
</button>
```

### Phase 2: ChangeDecisionDialog

#### File: `apps/web/src/components/lists/ChangeDecisionDialog.tsx`

**Changes:**

1. **Add loading prop to interface** (line 3-10):

```tsx
interface ChangeDecisionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    name: string;
    isLiked: boolean;
    familyName?: string;
    loading?: boolean;  // NEW
}
```

2. **Update component to destructure loading** (line 12-19):
```tsx
interface ChangeDecisionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    name: string;
    isLiked: boolean;
    familyName?: string;
    loading?: boolean;  // NEW
}
```

2. **Update component to destructure loading** (line 12-19):

```tsx
export function ChangeDecisionDialog({
    isOpen,
    onClose,
    onConfirm,
    name,
    isLiked,
    familyName,
    loading = false,  // NEW
}: ChangeDecisionDialogProps) {
```

3. **Update Confirm button to show loading state** (lines 78-84):

```tsx
<button
    type="button"
    onClick={onConfirm}
    disabled={loading}
    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
    {loading ? (
        <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Moving...
        </>
    ) : (
        'Confirm'
    )}
</button>
```

#### File: `apps/web/src/components/lists/NameCard.tsx`

**Changes:**

1. **Update ChangeDecisionDialog usage** (lines 134-141):

```tsx
<ChangeDecisionDialog
    isOpen={showDialog}
    onClose={handleDialogClose}
    onConfirm={handleConfirm}
    name={name}
    isLiked={isLiked}
    familyName={familyName}
    loading={isChanging}  // NEW
/>
```

---

### Phase 3: Onboarding Wizard

#### File: `apps/web/src/components/onboarding/OnboardingWizard.tsx`

**Changes:**

1. **Add savingPrefs state** (after line 35):

```tsx
const [savingPrefs, setSavingPrefs] = useState(false);
```

2. **Update goNext to manage saving state** (lines 93-99):
```tsx
const [savingPrefs, setSavingPrefs] = useState(false);
```

2. **Update goNext to manage saving state** (lines 93-99):

```tsx
const goNext = async () => {
    if (step === 2) {
        setSavingPrefs(true);
        setError('');
        const saved = await handleSavePreferences();
        setSavingPrefs(false);
        if (!saved) return;
    }
    if (step < 3) setStep(step + 1);
};
```

3. **Update Next button to show loading state** (lines 153-166):

```tsx
{step < 3 ? (
    <button
        type="button"
        onClick={goNext}
        disabled={!canProceed() || (step === 2 && savingPrefs)}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            !canProceed() || (step === 2 && savingPrefs)
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 shadow-nurture'
        }`}
    >
        {step === 2 && savingPrefs ? (
            <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
            </>
        ) : (
            <>
                Next
                <ChevronRight size={20} />
            </>
        )}
    </button>
) : null}
```

---

### Phase 4: DeleteUserDialog

#### File: `apps/web/src/components/lists/DeleteUserDialog.tsx`

**Changes:**

1. **Add loading prop to interface** (lines 3-10):

```tsx
interface DeleteUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    username: string;
    isCurrentUser: boolean;
    loading?: boolean;  // NEW
}
```

2. **Update component to destructure loading** (line 11-18):

```tsx
export function DeleteUserDialog({
    isOpen,
    onClose,
    onConfirm,
    username,
    isCurrentUser,
    loading = false,  // NEW
}: DeleteUserDialogProps) {
```

3. **Update Delete button to show loading state** (lines 81-87):

```tsx
<button
    type="button"
    onClick={onConfirm}
    disabled={loading}
    className="flex-1 px-6 py-3 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
    {loading ? (
        <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Deleting...
        </>
    ) : (
        'Delete'
    )}
</button>
```

#### File: `apps/web/src/routes/add-user.tsx`

**Changes:**

1. **Add deleting state** (after line 30):

```tsx
const [deleting, setDeleting] = useState(false);
```

2. **Update handleDeleteConfirm to manage loading** (lines 64-84):

```tsx
const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;

    const isCurrentUser = currentUser?.id === deleteUserId;
    setDeleting(true);
    setError('');

    try {
        await deleteUserMutation({ variables: { userId: deleteUserId } });

        if (isCurrentUser) {
            // Log out the deleted user
            await logout();
        } else {
            await refetchUsers();
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete user';
        setError(message);
    } finally {
        setDeleting(false);
        setDeleteUserId(null);
    }
};
```

3. **Update DeleteUserDialog usage** (lines 192-200):

```tsx
<DeleteUserDialog
    isOpen={!!deleteUserId}
    onClose={handleDeleteCancel}
    onConfirm={handleDeleteConfirm}
    username={userToDelete.username}
    isCurrentUser={currentUser?.id === deleteUserId}
    loading={deleting}  // NEW
/>
```

---

## Design System Reference

### Spinner Component

The standard spinner used across the app:

```tsx
// Small (form buttons)
<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

// Medium (large buttons)
<div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />

// Large (full-page loading)
<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
```

### Button Loading Pattern

```tsx
// Disabled state
disabled={loading || !otherCondition}

// Conditional classes
className={`base-classes ${
    loading || !condition ? 'disabled-classes' : 'active-classes'
}`}

// Content
{loading ? (
    <>
        <Spinner />
        Loading text...
    </>
) : (
    'Normal content'
)}
```

### Color Usage

- **Primary actions:** `bg-primary` (warm clay #D88C74)
- **Secondary actions:** `bg-sage-green` (#A8B8A0)
- **Disabled:** `bg-muted` or `opacity-50`
- **Spinner borders:** `border-white` on colored buttons, `border-primary` on light backgrounds

### Animation

- **Spinner:** `animate-spin` (Tailwind built-in)
- **Text loading:** `animate-pulse` (for text-based loading states)
- **Button:** `transition-all` for smooth state changes

---

## File Summary

### Files to Modify:

- **Login Component:**
  - `apps/web/src/components/auth/Login.tsx`
  - Lines: ~10, ~12-20, ~50-55
  - Changes: Add loading state, update handleSubmit, update button

- **ChangeDecisionDialog Component:**
  - `apps/web/src/components/lists/ChangeDecisionDialog.tsx`
  - Lines: ~3-10, ~12-19, ~78-84
  - Changes: Add loading prop, destructure loading, update Confirm button

- **NameCard Component:**
  - `apps/web/src/components/lists/NameCard.tsx`
  - Lines: ~134-141
  - Changes: Pass `isChanging` to ChangeDecisionDialog

- **Onboarding Wizard:**
  - `apps/web/src/components/onboarding/OnboardingWizard.tsx`
  - Lines: ~36, ~93-99, ~153-166
  - Changes: Add savingPrefs state, update goNext, update Next button

- **DeleteUserDialog Component:**
  - `apps/web/src/components/lists/DeleteUserDialog.tsx`
  - Lines: ~3-10, ~11-18, ~81-87
  - Changes: Add loading prop, destructure loading, update Delete button

- **Add User Route (for DeleteUserDialog):**
  - `apps/web/src/routes/add-user.tsx`
  - Lines: ~30, ~64-84, ~192-200
  - Changes: Add deleting state, update handleDeleteConfirm, pass loading to dialog

### Reference Files (No Changes):

- **UserStep** - Reference for button loading pattern
  - `apps/web/src/components/onboarding/UserStep.tsx` (lines 85-102)

- **Add User** - Reference for form submission with loading
  - `apps/web/src/routes/add-user.tsx` (lines 123-140)

- **Preferences** - Reference for save button with success/error states
  - `apps/web/src/routes/preferences.tsx` (lines 171-201)

- **SwipeView** - No changes (optimistic UI is optimal)
  - `apps/web/src/components/swipe/SwipeView.tsx`

---

## Verification Steps

### Manual Testing

1. **Login Flow:**
   - [ ] Start app: `pnpm dev`
   - [ ] Navigate to login page
   - [ ] Enter valid credentials and click "Sign In"
   - [ ] Verify button shows spinner and "Signing in..." text
   - [ ] Verify button is disabled during loading
   - [ ] Verify button is disabled when fields are empty
   - [ ] Test with invalid credentials - verify error displays and loading clears
   - [ ] Test successful login - verify navigates to home

2. **Onboarding Flow:**
   - [ ] Start fresh onboarding (clear localStorage or use incognito)
   - [ ] Step 1: Add a user, click "Next" - verify NO spinner (no save happens)
   - [ ] Step 2: Set preferences, click "Next"
   - [ ] Verify button shows spinner and "Saving..." during save
   - [ ] Verify button is disabled during save
   - [ ] Test with API error (stop server) - verify save failure prevents navigation
   - [ ] Test successful save - verify navigates to step 3
   - [ ] Step 3: Verify "Complete Setup" button already has loading state

3. **Change Decision Dialog Flow:**
   - [ ] Navigate to likes or dislikes page
   - [ ] Click on a name card
   - [ ] Click "Dislike" or "Like" button in overlay
   - [ ] Verify dialog appears
   - [ ] Click "Confirm" in dialog
   - [ ] Verify button shows spinner and "Moving..." text
   - [ ] Verify button is disabled during mutation
   - [ ] Verify dialog closes and card moves to other list
   - [ ] Verify card appears in target list

4. **Swipe Flow (No Changes Expected):**
   - [ ] Navigate to swipe view
   - [ ] Swipe a card left or right
   - [ ] Verify card disappears immediately (optimistic UI)
   - [ ] Verify smooth 60fps animations
   - [ ] Verify no loading indicator appears
   - [ ] Verify next card appears smoothly

5. **Delete User Dialog Flow:**
   - [ ] Navigate to "Family Members" page (add-user route)
   - [ ] Click the trash icon on a user
   - [ ] Verify dialog appears with user details
   - [ ] Click "Delete" in dialog
   - [ ] Verify button shows spinner and "Deleting..." text
   - [ ] Verify button is disabled during mutation
   - [ ] Verify dialog closes and user is removed from list
   - [ ] Test deleting current user - verify logout occurs

### Quality Checks

```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Format code before committing
pnpm format
```

### Visual Verification

- [ ] Spinner colors match brand palette (warm clay, sage green)
- [ ] Button disabled states are visually clear
- [ ] Loading text is legible and properly aligned
- [ ] Test on mobile viewport (responsive design)
- [ ] Test on dark/light mode (if applicable)

---

## User Experience Improvements

### Before

**Login:**

- User clicks "Sign In"
- Nothing happens for 1-2 seconds
- User may click again
- Suddenly page redirects

**Onboarding Step 2:**

- User clicks "Next"
- Nothing happens for 500ms
- User may click multiple times
- Suddenly page changes to step 3

**Delete User:**

- User clicks "Delete"
- Nothing happens during network request
- User may click multiple times
- Suddenly user disappears or page changes

### After

**Login:**

- User clicks "Sign In"
- Button immediately shows spinner + "Signing in..."
- Button is disabled (prevents double-click)
- Page redirects when complete

**Onboarding Step 2:**

- User clicks "Next"
- Button immediately shows spinner + "Saving..."
- Button is disabled (prevents double-click)
- Navigation happens only after save completes

**Delete User:**

- User clicks "Delete"
- Button immediately shows spinner + "Deleting..."
- Button is disabled (prevents double-click)
- Dialog closes and user is removed when complete

---

## Future Enhancements (Out of Scope)

1. **Toast Notification System** - For non-blocking error messages
2. **Button Component** - Extract to reusable component if 5+ buttons need loading
3. **Skeleton Screens** - For list loading states (likes/dislikes pages)
4. **Loading Overlay** - For full-page transitions during navigation
5. **Optimistic UI Updates** - For preferences save (instant feedback)
6. **Error Toast on Swipe Failure** - Only show if mutation fails (rare)

---

## Summary

**Estimated Implementation Time:** 60-75 minutes
**Risk Level:** Low - isolated changes, following existing patterns
**User Impact:** High - prevents confusion, improves perceived performance
**Lines of Code:** ~70 lines across 6 files
**New Components:** 0 (follows existing patterns)

This plan implements loading states for the 4 identified missing actions (Login, ChangeDecisionDialog, Onboarding, and DeleteUserDialog) while maintaining the existing design system and following established patterns. The swipe action is intentionally left unchanged as it already implements optimal optimistic UI patterns.
