import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SwipeState, useSwipeGesture } from '../useSwipeGesture';

describe('useSwipeGesture', () => {
	describe('initial state', () => {
		it('should start in idle state', () => {
			const { result } = renderHook(() => useSwipeGesture());

			expect(result.current.gestureState.state).toBe(SwipeState.idle);
			expect(result.current.gestureState.offset).toEqual({ x: 0, y: 0 });
			expect(result.current.gestureState.exitDirection).toBeNull();
			expect(result.current.isDragging).toBe(false);
			expect(result.current.isExiting).toBe(false);
		});
	});

	describe('drag gestures', () => {
		it('should transition to dragging state on mouse down', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			expect(result.current.gestureState.state).toBe(SwipeState.dragging);
			expect(result.current.isDragging).toBe(true);
		});

		it('should update offset during drag', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 150, clientY: 120 } as React.MouseEvent);
			});

			expect(result.current.gestureState.offset).toEqual({ x: 50, y: 20 });
		});

		it('should return to idle when drag ends below threshold', () => {
			const { result } = renderHook(() => useSwipeGesture({ threshold: 100 }));

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 150, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseUp();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.idle);
			expect(result.current.gestureState.offset).toEqual({ x: 0, y: 0 });
		});

		it('should transition to exiting when drag ends above threshold (right swipe)', () => {
			const { result } = renderHook(() => useSwipeGesture({ threshold: 100 }));

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 250, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseUp();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
			expect(result.current.gestureState.exitDirection).toBe('right');
			expect(result.current.isExiting).toBe(true);
		});

		it('should transition to exiting when drag ends above threshold (left swipe)', () => {
			const { result } = renderHook(() => useSwipeGesture({ threshold: 100 }));

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 200, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 50, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseUp();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
			expect(result.current.gestureState.exitDirection).toBe('left');
		});

		it('should ignore mouse move when not dragging', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 150, clientY: 100 } as React.MouseEvent);
			});

			expect(result.current.gestureState.offset).toEqual({ x: 0, y: 0 });
		});
	});

	describe('programmatic swipe (triggerSwipe)', () => {
		it('should trigger right swipe from idle state', () => {
			const { result } = renderHook(() => useSwipeGesture());

			let triggered = false;
			act(() => {
				triggered = result.current.triggerSwipe('right');
			});

			expect(triggered).toBe(true);
			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
			expect(result.current.gestureState.exitDirection).toBe('right');
		});

		it('should trigger left swipe from idle state', () => {
			const { result } = renderHook(() => useSwipeGesture());

			let triggered = false;
			act(() => {
				triggered = result.current.triggerSwipe('left');
			});

			expect(triggered).toBe(true);
			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
			expect(result.current.gestureState.exitDirection).toBe('left');
		});

		it('should NOT trigger swipe when already exiting', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.triggerSwipe('right');
			});

			let triggered = false;
			act(() => {
				triggered = result.current.triggerSwipe('left');
			});

			expect(triggered).toBe(false);
			expect(result.current.gestureState.exitDirection).toBe('right');
		});
	});

	describe('onExitComplete', () => {
		it('should return the exit direction and reset to idle', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.triggerSwipe('right');
			});

			expect(result.current.gestureState.state).toBe(SwipeState.exiting);

			let direction: 'left' | 'right' | null = null;
			act(() => {
				direction = result.current.onExitComplete();
			});

			expect(direction).toBe('right');
			expect(result.current.gestureState.state).toBe(SwipeState.idle);
			expect(result.current.gestureState.exitDirection).toBeNull();
			expect(result.current.gestureState.offset).toEqual({ x: 0, y: 0 });
		});

		it('should allow new swipe after onExitComplete', () => {
			const { result } = renderHook(() => useSwipeGesture());

			// First swipe
			act(() => {
				result.current.triggerSwipe('right');
			});

			// Complete
			act(() => {
				result.current.onExitComplete();
			});

			// Second swipe should work
			let triggered = false;
			act(() => {
				triggered = result.current.triggerSwipe('left');
			});

			expect(triggered).toBe(true);
			expect(result.current.gestureState.exitDirection).toBe('left');
		});
	});

	describe('reset', () => {
		it('should reset from exiting to idle', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.triggerSwipe('right');
			});

			expect(result.current.gestureState.state).toBe(SwipeState.exiting);

			act(() => {
				result.current.reset();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.idle);
			expect(result.current.gestureState.exitDirection).toBeNull();
		});

		it('should reset from dragging to idle', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 150, clientY: 100 } as React.MouseEvent);
			});

			expect(result.current.gestureState.state).toBe(SwipeState.dragging);

			act(() => {
				result.current.reset();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.idle);
			expect(result.current.gestureState.offset).toEqual({ x: 0, y: 0 });
		});
	});

	describe('touch events', () => {
		it('should handle touch start/move/end', () => {
			const { result } = renderHook(() => useSwipeGesture({ threshold: 100 }));

			act(() => {
				result.current.handlers.onTouchStart({
					touches: [{ clientX: 100, clientY: 100 }],
				} as unknown as React.TouchEvent);
			});

			expect(result.current.isDragging).toBe(true);

			act(() => {
				result.current.handlers.onTouchMove({
					touches: [{ clientX: 250, clientY: 100 }],
				} as unknown as React.TouchEvent);
			});

			expect(result.current.gestureState.offset.x).toBe(150);

			act(() => {
				result.current.handlers.onTouchEnd();
			});

			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
			expect(result.current.gestureState.exitDirection).toBe('right');
		});
	});

	describe('state machine invariants', () => {
		it('should not allow dragging while exiting', () => {
			const { result } = renderHook(() => useSwipeGesture());

			act(() => {
				result.current.triggerSwipe('right');
			});

			expect(result.current.isExiting).toBe(true);

			// Try to start a new drag - should be ignored
			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			// State should still be exiting, not dragging
			expect(result.current.gestureState.state).toBe(SwipeState.exiting);
		});

		it('should preserve exit offset from drag gesture', () => {
			const { result } = renderHook(() => useSwipeGesture({ threshold: 100 }));

			act(() => {
				result.current.handlers.onMouseDown({ clientX: 100, clientY: 100 } as React.MouseEvent);
			});

			act(() => {
				result.current.handlers.onMouseMove({ clientX: 250, clientY: 120 } as React.MouseEvent);
			});

			const offsetBeforeEnd = { ...result.current.gestureState.offset };

			act(() => {
				result.current.handlers.onMouseUp();
			});

			// Offset should be preserved when transitioning to exiting
			expect(result.current.gestureState.offset).toEqual(offsetBeforeEnd);
		});
	});
});
