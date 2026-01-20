import { useCallback, useRef, useState } from 'react';

/**
 * Swipe direction: 'left' for dislike, 'right' for like
 */
export type SwipeDirection = 'left' | 'right';

/**
 * The possible states of the swipe gesture state machine.
 * Using a state machine prevents invalid state combinations that can cause stuck cards.
 */
export const SwipeState = {
	/** Card is idle and waiting for interaction */
	idle: 'idle',
	/** User is actively dragging the card */
	dragging: 'dragging',
	/** Card is animating out after a successful swipe */
	exiting: 'exiting',
} as const;

export type SwipeState = (typeof SwipeState)[keyof typeof SwipeState];

interface SwipeGestureOptions {
	threshold?: number;
}

export interface SwipeGestureState {
	/** Current state of the swipe gesture */
	state: SwipeState;
	/** Current drag offset */
	offset: { x: number; y: number };
	/** Direction the card is exiting (only set when state is 'exiting') */
	exitDirection: SwipeDirection | null;
}

export interface SwipeGestureHandlers {
	onMouseDown: (e: React.MouseEvent) => void;
	onMouseMove: (e: React.MouseEvent) => void;
	onMouseUp: () => void;
	onMouseLeave: () => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchMove: (e: React.TouchEvent) => void;
	onTouchEnd: () => void;
}

export interface SwipeGestureResult {
	handlers: SwipeGestureHandlers;
	/** Current gesture state */
	gestureState: SwipeGestureState;
	/** Convenience getters for common checks */
	isDragging: boolean;
	isExiting: boolean;
	offset: { x: number; y: number };
	exitDirection: SwipeDirection | null;
	/** Call this when the exit animation completes. Returns the direction that was swiped. */
	onExitComplete: () => SwipeDirection | null;
	/** Trigger a programmatic swipe (e.g., from button click). Returns true if swipe was triggered. */
	triggerSwipe: (direction: SwipeDirection) => boolean;
	/** Reset the gesture to idle state (e.g., for recovering from stuck states) */
	reset: () => void;
}

/**
 * Hook for handling swipe gestures using a state machine pattern.
 *
 * The state machine ensures we can never have invalid state combinations:
 * - idle: offset is {0,0}, exitDirection is null
 * - dragging: offset reflects current drag, exitDirection is null
 * - exiting: offset is frozen at swipe point, exitDirection is set
 *
 * Transitions:
 * - idle -> dragging: on pointer down
 * - dragging -> idle: on pointer up without threshold
 * - dragging -> exiting: on pointer up with threshold exceeded
 * - idle -> exiting: on programmatic triggerSwipe
 * - exiting -> idle: on onExitComplete
 */
export function useSwipeGesture({ threshold = 100 }: SwipeGestureOptions = {}): SwipeGestureResult {
	// Combined state to ensure atomic updates
	const [gestureState, setGestureState] = useState<SwipeGestureState>({
		state: SwipeState.idle,
		offset: { x: 0, y: 0 },
		exitDirection: null,
	});

	// Refs for synchronous access during event handlers
	// These are updated BEFORE setState to ensure synchronous checks are accurate
	const stateRef = useRef<SwipeState>(SwipeState.idle);
	const startPosRef = useRef({ x: 0, y: 0 });
	const currentOffsetRef = useRef({ x: 0, y: 0 });
	const exitDirectionRef = useRef<SwipeDirection | null>(null);

	/**
	 * Transition to dragging state when user starts interaction
	 */
	const handleStart = useCallback((clientX: number, clientY: number) => {
		// Can only start dragging from idle state
		if (stateRef.current !== SwipeState.idle) {
			return;
		}

		// Update ref BEFORE setState for synchronous access
		stateRef.current = SwipeState.dragging;
		startPosRef.current = { x: clientX, y: clientY };
		currentOffsetRef.current = { x: 0, y: 0 };

		// Helpful debugging for stuck cards: log state transitions
		// eslint-disable-next-line no-console
		console.log('[useSwipeGesture] handleStart -> dragging', {
			clientX,
			clientY,
		});

		setGestureState({
			state: SwipeState.dragging,
			offset: { x: 0, y: 0 },
			exitDirection: null,
		});
	}, []);

	/**
	 * Update offset during drag
	 */
	const handleMove = useCallback((clientX: number, clientY: number) => {
		// Can only move while dragging
		if (stateRef.current !== SwipeState.dragging) {
			return;
		}

		const deltaX = clientX - startPosRef.current.x;
		const deltaY = clientY - startPosRef.current.y;

		// Update ref BEFORE setState for synchronous access
		currentOffsetRef.current = { x: deltaX, y: deltaY };

		setGestureState({
			state: SwipeState.dragging,
			offset: { x: deltaX, y: deltaY },
			exitDirection: null,
		});
	}, []);

	/**
	 * Handle end of drag - either return to idle or transition to exiting
	 */
	const handleEnd = useCallback(() => {
		// Can only end while dragging
		if (stateRef.current !== SwipeState.dragging) {
			return;
		}

		const offset = currentOffsetRef.current;

		if (Math.abs(offset.x) > threshold) {
			// Threshold exceeded - transition to exiting
			const direction: SwipeDirection = offset.x > 0 ? 'right' : 'left';

			// Update refs BEFORE setState for synchronous access
			stateRef.current = SwipeState.exiting;
			exitDirectionRef.current = direction;

			// eslint-disable-next-line no-console
			console.log('[useSwipeGesture] handleEnd -> exiting', {
				offset,
				direction,
				threshold,
			});

			setGestureState({
				state: SwipeState.exiting,
				offset, // Keep the offset where it was for smooth animation
				exitDirection: direction,
			});
		} else {
			// Threshold not met - return to idle
			// Update refs BEFORE setState for synchronous access
			stateRef.current = SwipeState.idle;
			currentOffsetRef.current = { x: 0, y: 0 };

			// eslint-disable-next-line no-console
			console.log('[useSwipeGesture] handleEnd -> idle (below threshold)', {
				offset,
				threshold,
			});

			setGestureState({
				state: SwipeState.idle,
				offset: { x: 0, y: 0 },
				exitDirection: null,
			});
		}
	}, [threshold]);

	/**
	 * Called when exit animation completes.
	 * Returns the direction so the caller can handle the swipe action.
	 */
	const onExitComplete = useCallback((): SwipeDirection | null => {
		const direction = exitDirectionRef.current;

		// eslint-disable-next-line no-console
		console.log('[useSwipeGesture] onExitComplete -> idle', {
			previousDirection: direction,
		});

		// Update refs BEFORE setState for synchronous access
		stateRef.current = SwipeState.idle;
		currentOffsetRef.current = { x: 0, y: 0 };
		exitDirectionRef.current = null;

		// Transition back to idle
		setGestureState({
			state: SwipeState.idle,
			offset: { x: 0, y: 0 },
			exitDirection: null,
		});

		return direction;
	}, []);

	/**
	 * Trigger a programmatic swipe (e.g., from button click).
	 * Returns true if the swipe was triggered, false if blocked.
	 */
	const triggerSwipe = useCallback((direction: SwipeDirection): boolean => {
		// Can only trigger from idle state
		if (stateRef.current !== SwipeState.idle) {
			// eslint-disable-next-line no-console
			console.log('[useSwipeGesture] triggerSwipe blocked (not idle)', {
				currentState: stateRef.current,
				requestedDirection: direction,
			});
			return false;
		}

		// Update refs BEFORE setState for synchronous access
		stateRef.current = SwipeState.exiting;
		exitDirectionRef.current = direction;

		// eslint-disable-next-line no-console
		console.log('[useSwipeGesture] triggerSwipe -> exiting', {
			direction,
		});

		setGestureState({
			state: SwipeState.exiting,
			offset: { x: 0, y: 0 },
			exitDirection: direction,
		});

		return true;
	}, []);

	/**
	 * Force reset to idle state (recovery mechanism for stuck cards)
	 */
	const reset = useCallback(() => {
		// eslint-disable-next-line no-console
		console.log('[useSwipeGesture] reset -> idle', {
			previousState: stateRef.current,
			previousOffset: currentOffsetRef.current,
			previousExitDirection: exitDirectionRef.current,
		});

		// Update refs BEFORE setState for synchronous access
		stateRef.current = SwipeState.idle;
		currentOffsetRef.current = { x: 0, y: 0 };
		exitDirectionRef.current = null;

		setGestureState({
			state: SwipeState.idle,
			offset: { x: 0, y: 0 },
			exitDirection: null,
		});
	}, []);

	const handlers: SwipeGestureHandlers = {
		onMouseDown: (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
		onMouseMove: (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
		onMouseUp: handleEnd,
		onMouseLeave: handleEnd,
		onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
		onTouchMove: (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
		onTouchEnd: handleEnd,
	};

	return {
		handlers,
		gestureState,
		// Convenience getters
		isDragging: gestureState.state === SwipeState.dragging,
		isExiting: gestureState.state === SwipeState.exiting,
		offset: gestureState.offset,
		exitDirection: gestureState.exitDirection,
		onExitComplete,
		triggerSwipe,
		reset,
	};
}
