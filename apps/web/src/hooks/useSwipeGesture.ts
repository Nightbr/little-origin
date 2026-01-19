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
		if (Math.abs(offset.x) > threshold) {
			if (offset.x > 0) onSwipeRight();
			else onSwipeLeft();
		}
		setIsDragging(false);
		setOffset({ x: 0, y: 0 });
	};

	const handlers = {
		onMouseDown: (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
		onMouseMove: (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
		onMouseUp: handleEnd,
		onMouseLeave: handleEnd,
		onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
		onTouchMove: (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
		onTouchEnd: handleEnd,
	};

	return { handlers, offset, isDragging };
}
