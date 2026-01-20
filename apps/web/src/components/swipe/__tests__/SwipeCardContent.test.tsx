import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type NameData, SwipeCardContent } from '../SwipeCardContent';

const mockName: NameData = {
	id: 'test-id-123',
	name: 'Emma',
	originCountry: 'France',
	gender: 'female',
};

const mockBoyName: NameData = {
	id: 'test-id-456',
	name: 'Lucas',
	originCountry: 'Germany',
	gender: 'male',
};

describe('SwipeCardContent', () => {
	describe('rendering', () => {
		it('should render the name', () => {
			render(<SwipeCardContent name={mockName} />);

			expect(screen.getByText('Emma')).toBeInTheDocument();
		});

		it('should render the origin country', () => {
			render(<SwipeCardContent name={mockName} />);

			expect(screen.getByText('France')).toBeInTheDocument();
		});

		it('should render action buttons by default', () => {
			render(<SwipeCardContent name={mockName} />);

			expect(screen.getByRole('button', { name: 'Dislike' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument();
		});

		it('should hide action buttons when showButtons is false', () => {
			render(<SwipeCardContent name={mockName} showButtons={false} />);

			expect(screen.queryByRole('button', { name: 'Dislike' })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Like' })).not.toBeInTheDocument();
		});
	});

	describe('button interactions', () => {
		it('should call onDislike when dislike button is clicked', () => {
			const onDislike = vi.fn();
			render(<SwipeCardContent name={mockName} onDislike={onDislike} />);

			fireEvent.click(screen.getByRole('button', { name: 'Dislike' }));

			expect(onDislike).toHaveBeenCalledTimes(1);
		});

		it('should call onLike when like button is clicked', () => {
			const onLike = vi.fn();
			render(<SwipeCardContent name={mockName} onLike={onLike} />);

			fireEvent.click(screen.getByRole('button', { name: 'Like' }));

			expect(onLike).toHaveBeenCalledTimes(1);
		});

		it('should disable buttons when buttonsDisabled is true', () => {
			const onDislike = vi.fn();
			const onLike = vi.fn();
			render(
				<SwipeCardContent name={mockName} buttonsDisabled onDislike={onDislike} onLike={onLike} />,
			);

			const dislikeButton = screen.getByRole('button', { name: 'Dislike' });
			const likeButton = screen.getByRole('button', { name: 'Like' });

			expect(dislikeButton).toBeDisabled();
			expect(likeButton).toBeDisabled();

			fireEvent.click(dislikeButton);
			fireEvent.click(likeButton);

			expect(onDislike).not.toHaveBeenCalled();
			expect(onLike).not.toHaveBeenCalled();
		});
	});

	describe('overlays', () => {
		it('should show overlays by default', () => {
			const { container } = render(<SwipeCardContent name={mockName} />);

			// Both overlays should exist (with opacity 0 by default)
			const overlays = container.querySelectorAll('.absolute.inset-0');
			expect(overlays.length).toBeGreaterThanOrEqual(2);
		});

		it('should hide overlays when showOverlays is false', () => {
			const { container } = render(<SwipeCardContent name={mockName} showOverlays={false} />);

			// Only the background gradient should exist, not the like/dislike overlays
			const overlays = container.querySelectorAll('.absolute.inset-0');
			// Should only have the background gradient
			expect(overlays.length).toBe(1);
		});
	});

	describe('gender styling', () => {
		it('should render female name correctly', () => {
			render(<SwipeCardContent name={mockName} />);

			expect(screen.getByText('Emma')).toBeInTheDocument();
		});

		it('should render male name correctly', () => {
			render(<SwipeCardContent name={mockBoyName} />);

			expect(screen.getByText('Lucas')).toBeInTheDocument();
		});
	});
});
