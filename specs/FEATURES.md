# Feature Implementation Details

Detailed implementation guide for all core features of Little Origin.

---

## Table of Contents

1. [Swipe Interface](#swipe-interface)
2. [Undo Functionality](#undo-functionality)
3. [Match Detection](#match-detection)
4. [Real-time Notifications](#real-time-notifications)
5. [Name Pool Management](#name-pool-management)
6. [Multi-user Support](#multi-user-support)
7. [Onboarding Flow](#onboarding-flow)

---

## Swipe Interface

### Overview

Tinder-style swipe interface supporting:
- Mouse drag (desktop)
- Touch gestures (mobile)
- Keyboard arrows
- Button clicks

### Implementation

#### 1. Gesture Hook

```typescript
// apps/web/src/hooks/useSwipeGesture.ts

import { useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: SwipeGestureOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    setOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const { x } = offset;
    
    // Trigger swipe if past threshold
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
    
    // Reset
    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
  };

  const handlers = {
    // Mouse
    onMouseDown: (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
    
    // Touch
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: handleEnd,
  };

  return { handlers, offset, isDragging };
}
```

#### 2. Swipe Card Component

```typescript
// apps/web/src/components/swipe/SwipeCard.tsx

import { motion } from 'framer-motion';
import { useSwipeGesture } from '@hooks/useSwipeGesture';

interface SwipeCardProps {
  name: Name;
  onLike: () => void;
  onDislike: () => void;
}

export function SwipeCard({ name, onLike, onDislike }: SwipeCardProps) {
  const { handlers, offset, isDragging } = useSwipeGesture({
    onSwipeLeft: onDislike,
    onSwipeRight: onLike,
    threshold: 100,
  });

  // Calculate rotation based on drag
  const rotation = (offset.x / 20);
  
  // Calculate opacity for colored overlay
  const rightOpacity = Math.max(0, Math.min(1, offset.x / 100));
  const leftOpacity = Math.max(0, Math.min(1, -offset.x / 100));

  return (
    <motion.div
      className="swipe-card"
      {...handlers}
      style={{
        x: offset.x,
        y: offset.y,
        rotate: rotation,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      animate={{
        scale: isDragging ? 1.05 : 1,
      }}
    >
      {/* Like overlay (green) */}
      {rightOpacity > 0 && (
        <div 
          className="overlay like"
          style={{ opacity: rightOpacity }}
        >
          <Heart size={64} />
        </div>
      )}
      
      {/* Dislike overlay (red) */}
      {leftOpacity > 0 && (
        <div 
          className="overlay dislike"
          style={{ opacity: leftOpacity }}
        >
          <X size={64} />
        </div>
      )}
      
      {/* Card content */}
      <div className="card-content">
        <h1>{name.name}</h1>
        <p>{getCountryFlag(name.originCountry)} {name.originCountry}</p>
      </div>
    </motion.div>
  );
}
```

#### 3. Swipe Controls

```typescript
// apps/web/src/components/swipe/SwipeControls.tsx

import { X, Heart, RotateCcw } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { REVIEW_NAME, UNDO_REVIEW } from '@graphql/mutations';

interface SwipeControlsProps {
  nameId: string;
  onComplete: () => void;
  canUndo: boolean;
}

export function SwipeControls({ nameId, onComplete, canUndo }: SwipeControlsProps) {
  const [reviewName] = useMutation(REVIEW_NAME, {
    refetchQueries: ['NextName', 'Matches'],
    onCompleted: onComplete,
  });
  
  const [undoReview] = useMutation(UNDO_REVIEW, {
    refetchQueries: ['NextName', 'Matches'],
  });

  const handleDislike = () => {
    reviewName({ variables: { nameId, isLiked: false } });
  };

  const handleLike = () => {
    reviewName({ variables: { nameId, isLiked: true } });
  };

  const handleUndo = () => {
    undoReview();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleDislike();
      if (e.key === 'ArrowRight') handleLike();
      if (e.key === 'u' && canUndo) handleUndo();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nameId, canUndo]);

  return (
    <div className="swipe-controls">
      <button 
        onClick={handleDislike}
        className="btn-dislike"
        aria-label="Dislike"
      >
        <X size={32} />
      </button>
      
      {canUndo && (
        <button 
          onClick={handleUndo}
          className="btn-undo"
          aria-label="Undo"
        >
          <RotateCcw size={24} />
        </button>
      )}
      
      <button 
        onClick={handleLike}
        className="btn-like"
        aria-label="Like"
      >
        <Heart size={32} />
      </button>
    </div>
  );
}
```

---

## Undo Functionality

### Backend Implementation

```typescript
// apps/api/src/services/review.service.ts

import { db } from '../db/client';
import { reviews } from '@little-origin/core';
import { eq, desc } from 'drizzle-orm';

class ReviewService {
  async undoLastReview(userId: number): Promise<Review | null> {
    // Get most recent review
    const lastReview = await db.query.reviews.findFirst({
      where: eq(reviews.userId, userId),
      orderBy: [desc(reviews.reviewedAt)],
      with: {
        name: true,
      },
    });

    if (!lastReview) {
      return null;
    }

    // Delete the review
    await db.delete(reviews)
      .where(eq(reviews.id, lastReview.id));

    // Recalculate match status for this name
    await this.matchService.recalculateMatch(lastReview.nameId);

    return lastReview;
  }
}
```

### Frontend State Management

```typescript
// apps/web/src/hooks/useSwipe.ts

import { useState } from 'react';
import { useMutation } from '@apollo/client';

export function useSwipe() {
  const [history, setHistory] = useState<Review[]>([]);
  
  const [reviewName] = useMutation(REVIEW_NAME, {
    onCompleted: (data) => {
      setHistory(prev => [...prev, data.reviewName]);
    },
  });
  
  const [undoReview] = useMutation(UNDO_REVIEW, {
    onCompleted: () => {
      setHistory(prev => prev.slice(0, -1));
    },
  });

  const canUndo = history.length > 0;

  return { reviewName, undoReview, canUndo, history };
}
```

---

## Match Detection

### Match Creation Logic

```typescript
// apps/api/src/services/match.service.ts

import { db } from '../db/client';
import { matches, reviews } from '@little-origin/core';
import { eq, and, count } from 'drizzle-orm';
import { pubsub } from '../pubsub';

class MatchService {
  private readonly MATCH_THRESHOLD = 2;

  async checkAndCreateMatch(nameId: number): Promise<Match | null> {
    // Count likes for this name
    const result = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(
        eq(reviews.nameId, nameId),
        eq(reviews.isLiked, true)
      ));

    const likesCount = result[0].count;

    // Not enough likes
    if (likesCount < this.MATCH_THRESHOLD) {
      // Delete match if it exists but no longer valid
      await db.delete(matches)
        .where(eq(matches.nameId, nameId));
      return null;
    }

    // Check if match already exists
    const existingMatch = await db.query.matches.findFirst({
      where: eq(matches.nameId, nameId),
    });

    if (existingMatch) {
      // Update user count
      const [updated] = await db
        .update(matches)
        .set({ userCount: likesCount })
        .where(eq(matches.id, existingMatch.id))
        .returning();

      return updated;
    }

    // Create new match
    const [newMatch] = await db
      .insert(matches)
      .values({
        nameId,
        userCount: likesCount,
      })
      .returning();

    // Publish to subscribers
    const matchWithDetails = await this.getMatchWithDetails(newMatch.id);
    pubsub.publish('MATCH_CREATED', { matchCreated: matchWithDetails });

    return newMatch;
  }

  async recalculateMatch(nameId: number): Promise<void> {
    // Called when review is deleted (undo)
    await this.checkAndCreateMatch(nameId);
  }

  async getMatchWithDetails(matchId: number) {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        name: true,
      },
    });

    // Get users who liked this name
    const userLikes = await db
      .select({ user: users })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(and(
        eq(reviews.nameId, match.nameId),
        eq(reviews.isLiked, true)
      ));

    return {
      ...match,
      likedBy: userLikes.map(ul => ul.user),
    };
  }

  async getAllMatches() {
    const allMatches = await db.query.matches.findMany({
      orderBy: [desc(matches.userCount), desc(matches.matchedAt)],
      with: { name: true },
    });

    return Promise.all(
      allMatches.map(m => this.getMatchWithDetails(m.id))
    );
  }
}
```

---

## Real-time Notifications

### GraphQL Subscriptions Setup

```typescript
// apps/api/src/pubsub.ts

import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const EVENTS = {
  MATCH_CREATED: 'MATCH_CREATED',
  NAME_POOL_STATUS: 'NAME_POOL_STATUS',
} as const;
```

### Subscription Resolvers

```typescript
// apps/api/src/graphql/resolvers/match.ts

import { pubsub, EVENTS } from '../../pubsub';

export const matchResolvers = {
  Subscription: {
    matchCreated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.MATCH_CREATED]),
    },
    
    namePoolStatusChanged: {
      subscribe: () => pubsub.asyncIterator([EVENTS.NAME_POOL_STATUS]),
    },
  },
};
```

### Frontend Subscription

```typescript
// apps/web/src/components/match/MatchNotification.tsx

import { useSubscription } from '@apollo/client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MATCH_CREATED_SUB = gql`
  subscription OnMatchCreated {
    matchCreated {
      id
      name {
        name
        gender
      }
      likedBy {
        username
      }
    }
  }
`;

export function MatchNotification() {
  const { data } = useSubscription(MATCH_CREATED_SUB);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data?.matchCreated) {
      setShow(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  return (
    <AnimatePresence>
      {show && data?.matchCreated && (
        <motion.div
          className="match-notification"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
        >
          <h2>🎉 IT'S A MATCH! 🎉</h2>
          <p className="name">✨ {data.matchCreated.name.name} ✨</p>
          <p className="users">
            Loved by: {data.matchCreated.likedBy.map(u => u.username).join(', ')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Name Pool Management

### Auto-refill Logic

```typescript
// apps/api/src/services/name.service.ts

import { db } from '../db/client';
import { names, reviews } from '@little-origin/core';
import { notInArray, count } from 'drizzle-orm';
import { pubsub, EVENTS } from '../pubsub';

class NameService {
  private readonly LOW_THRESHOLD = 10;
  private readonly REFILL_COUNT = 250;
  private isRefilling = false;

  async getNextName(userId: number): Promise<Name | null> {
    // Get unreviewd names
    const unreviewedNames = await db
      .select()
      .from(names)
      .where(
        notInArray(
          names.id,
          db.select({ id: reviews.nameId })
            .from(reviews)
            .where(eq(reviews.userId, userId))
        )
      )
      .limit(1);

    // Check pool status
    const remaining = await this.getRemainingCount(userId);
    
    if (remaining < this.LOW_THRESHOLD && !this.isRefilling) {
      // Trigger background refill
      this.refillNamesBackground();
      
      // Notify clients
      pubsub.publish(EVENTS.NAME_POOL_STATUS, {
        namePoolStatusChanged: {
          remaining,
          needsRefill: true,
        },
      });
    }

    return unreviewedNames[0] || null;
  }

  private async refillNamesBackground(): Promise<void> {
    this.isRefilling = true;
    
    setTimeout(async () => {
      try {
        const prefs = await this.getPreferences();
        const count = await this.seedNames(prefs, this.REFILL_COUNT);
        
        console.log(`Refilled ${count} names`);
      } catch (error) {
        console.error('Background refill failed:', error);
      } finally {
        this.isRefilling = false;
      }
    }, 0);
  }

  private async getRemainingCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(names)
      .where(
        notInArray(
          names.id,
          db.select({ id: reviews.nameId })
            .from(reviews)
            .where(eq(reviews.userId, userId))
        )
      );

    return result[0].count;
  }
}
```

---

## Multi-user Support

### User Limit Validation

```typescript
// apps/api/src/graphql/resolvers/auth.ts

import { MAX_USERS } from '@little-origin/core';

export const authResolvers = {
  Mutation: {
    createUsers: async (_, { users }, { db }) => {
      // Check if users already exist
      const existingCount = await db
        .select({ count: count() })
        .from(usersTable);

      if (existingCount[0].count > 0) {
        throw new Error('Users already exist. Cannot run onboarding.');
      }

      // Validate user limit
      if (users.length > MAX_USERS) {
        throw new Error(`Maximum ${MAX_USERS} users allowed`);
      }

      // Create users
      const createdUsers = [];
      for (const input of users) {
        const validated = schemas.registerUser.parse(input);
        const passwordHash = await hashPassword(validated.password);
        
        const [user] = await db.insert(usersTable)
          .values({
            username: validated.username,
            passwordHash,
          })
          .returning();
        
        createdUsers.push(user);
      }

      return createdUsers;
    },
  },
};
```

### All Users View

```typescript
// apps/web/src/components/views/AllUsersView.tsx

import { useQuery } from '@apollo/client';

const ALL_USERS_QUERY = gql`
  query AllUsersReviews {
    allUsersReviews {
      user {
        id
        username
      }
      likes {
        id
        name
        gender
      }
      dislikes {
        id
        name
        gender
      }
      likeCount
      dislikeCount
    }
  }
`;

export function AllUsersView() {
  const { data, loading } = useQuery(ALL_USERS_QUERY);

  if (loading) return <Spinner />;

  return (
    <div className="all-users-view">
      {data?.allUsersReviews.map((userReview) => (
        <div key={userReview.user.id} className="user-card">
          <h3>👤 {userReview.user.username}</h3>
          
          <div className="stats">
            <span>♥ {userReview.likeCount} Likes</span>
            <span>✗ {userReview.dislikeCount} Dislikes</span>
          </div>
          
          <details>
            <summary>Liked Names</summary>
            <ul>
              {userReview.likes.map(name => (
                <li key={name.id}>{name.name}</li>
              ))}
            </ul>
          </details>
          
          <details>
            <summary>Disliked Names</summary>
            <ul>
              {userReview.dislikes.map(name => (
                <li key={name.id}>{name.name}</li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
}
```

---

## Onboarding Flow

### Multi-step Onboarding Component

```typescript
// apps/web/src/components/onboarding/OnboardingFlow.tsx

import { useState } from 'react';
import { useMutation } from '@apollo/client';

enum OnboardingStep {
  CREATE_USERS = 1,
  SET_PREFERENCES = 2,
  SEED_NAMES = 3,
}

export function OnboardingFlow() {
  const [step, setStep] = useState(OnboardingStep.CREATE_USERS);
  const [users, setUsers] = useState([]);
  
  const [createUsers] = useMutation(CREATE_USERS_MUTATION);
  const [setPreferences] = useMutation(SET_PREFERENCES_MUTATION);
  const [seedNames] = useMutation(SEED_NAMES_MUTATION);

  const handleUsersCreated = async (userData) => {
    await createUsers({ variables: { users: userData } });
    setUsers(userData);
    setStep(OnboardingStep.SET_PREFERENCES);
  };

  const handlePreferencesSet = async (prefs) => {
    await setPreferences({ variables: { input: prefs } });
    setStep(OnboardingStep.SEED_NAMES);
  };

  const handleNamesSeeded = async () => {
    await seedNames();
    // Redirect to app
    window.location.href = '/swipe';
  };

  return (
    <div className="onboarding-flow">
      {step === OnboardingStep.CREATE_USERS && (
        <UserCreation onComplete={handleUsersCreated} />
      )}
      
      {step === OnboardingStep.SET_PREFERENCES && (
        <PreferencesSetup onComplete={handlePreferencesSet} />
      )}
      
      {step === OnboardingStep.SEED_NAMES && (
        <NameSeeding onComplete={handleNamesSeeded} />
      )}
    </div>
  );
}
```

---

## Summary

**Implemented Features:**
- ✅ Swipe interface (mouse + touch)
- ✅ Undo last action
- ✅ Real-time match detection
- ✅ WebSocket notifications
- ✅ Auto-refill name pool
- ✅ Multi-user support (max 10)
- ✅ Complete onboarding flow

**Next Steps:**
- See [NAME_SOURCING.md](./NAME_SOURCING.md) for AI integration
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for setup
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deploy