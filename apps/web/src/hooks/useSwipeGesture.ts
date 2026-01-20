import { useCallback, useRef, useState } from 'react';

type ExitDirection = 'left' | 'right' | null;

interface SwipeGestureOptions {
	threshold?: number;
}

interface SwipeGestureResult {
	handlers: {
		onMouseDown: (e: React.MouseEvent) => void;
		onMouseMove: (e: React.MouseEvent) => void;
		onMouseUp: () => void;
		onMouseLeave: () => void;
		onTouchStart: (e: React.TouchEvent) => void;
		onTouchMove: (e: React.TouchEvent) => void;
		onTouchEnd: () => void;
	};
	offset: { x: number; y: number };
	isDragging: boolean;
	isExiting: boolean;
	exitDirection: ExitDirection;
	/** Call this when the exit animation completes. Returns the direction that was swiped. */
	onExitComplete: () => ExitDirection;
	/** Trigger a programmatic swipe (e.g., from button click) */
	triggerSwipe: (direction: 'left' | 'right') => void;
}

/**
 * Hook for handling swipe gestures.
 *
 * IMPORTANT: This hook no longer takes callbacks. Instead, it returns the exit direction
 * from onExitComplete, and the caller is responsible for handling the swipe action.
 * This avoids stale closure issues where the wrong ID could be captured.
 */
export function useSwipeGesture({ threshold = 100 }: SwipeGestureOptions = {}): SwipeGestureResult {
	const [isDragging, setIsDragging] = useState(false);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [isExiting, setIsExiting] = useState(false);
	const [exitDirection, setExitDirection] = useState<ExitDirection>(null);
	const startPos = useRef({ x: 0, y: 0 });
	const isExitingRef = useRef(false);
	const exitDirectionRef = useRef<ExitDirection>(null);

	// Keep refs in sync
	isExitingRef.current = isExiting;
	exitDirectionRef.current = exitDirection;

	const handleStart = (clientX: number, clientY: number) => {
		if (isExitingRef.current) return;
		setIsDragging(true);
		startPos.current = { x: clientX, y: clientY };
	};

	const handleMove = (clientX: number, clientY: number) => {
		if (!isDragging || isExitingRef.current) return;
		const deltaX = clientX - startPos.current.x;
		const deltaY = clientY - startPos.current.y;
		setOffset({ x: deltaX, y: deltaY });
	};

	const handleEnd = () => {
		if (!isDragging || isExitingRef.current) return;
		setIsDragging(false);

		if (Math.abs(offset.x) > threshold) {
			const direction = offset.x > 0 ? 'right' : 'left';
			setExitDirection(direction);
			setIsExiting(true);
			isExitingRef.current = true;
		} else {
			setOffset({ x: 0, y: 0 });
		}
	};

	// Called when exit animation completes
	// Returns the direction so the caller can handle the action with current data (avoiding stale closures)
	const onExitComplete = useCallback((): ExitDirection => {
		const direction = exitDirectionRef.current;
		console.log('[useSwipeGesture] onExitComplete called, direction:', direction);

		// Reset state
		setIsExiting(false);
		setExitDirection(null);
		setOffset({ x: 0, y: 0 });
		isExitingRef.current = false;
		exitDirectionRef.current = null;

		// Return the direction so caller can handle the swipe action
		return direction;
	}, []);

	// Programmatic swipe (for button clicks)
	const triggerSwipe = useCallback((direction: 'left' | 'right') => {
		console.log(
			`[useSwipeGesture] triggerSwipe called: direction=${direction}, isExitingRef=${isExitingRef.current}`,
		);
		if (isExitingRef.current) {
			console.log('[useSwipeGesture] triggerSwipe blocked - already exiting');
			return;
		}
		// Cancel any ongoing drag
		setIsDragging(false);
		setOffset({ x: 0, y: 0 });
		// Trigger exit animation - use functional updates to ensure state changes
		console.log(`[useSwipeGesture] Setting exitDirection to ${direction} and isExiting to true`);
		setExitDirection(direction);
		setIsExiting(true);
		isExitingRef.current = true;
		console.log('[useSwipeGesture] State updates dispatched');
	}, []);

	const handlers = {
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
		offset,
		isDragging,
		isExiting,
		exitDirection,
		onExitComplete,
		triggerSwipe,
	};
}
