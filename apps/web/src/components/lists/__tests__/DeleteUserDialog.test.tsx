import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteUserDialog } from '../DeleteUserDialog';

describe('DeleteUserDialog', () => {
	describe('rendering', () => {
		it('should not render when isOpen is false', () => {
			render(
				<DeleteUserDialog
					isOpen={false}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		});

		it('should render when isOpen is true', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			expect(screen.getByRole('alertdialog')).toBeInTheDocument();
			expect(screen.getByText('Delete Family Member?')).toBeInTheDocument();
		});

		it('should display the username', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="john_doe"
					isCurrentUser={false}
				/>,
			);

			expect(screen.getByText(/john_doe/)).toBeInTheDocument();
		});

		it('should show warning for current user', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="myself"
					isCurrentUser={true}
				/>,
			);

			expect(
				screen.getByText(
					/You will be logged out and will need to create a new account to continue/,
				),
			).toBeInTheDocument();
		});

		it('should show standard message for other users', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="otheruser"
					isCurrentUser={false}
				/>,
			);

			expect(screen.getByText(/Their reviews and matches will be removed/)).toBeInTheDocument();
		});

		it('should render Cancel and Delete buttons', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		});
	});

	describe('interactions', () => {
		it('should call onClose when Cancel button is clicked', () => {
			const onClose = vi.fn();
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={onClose}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('should call onConfirm when Delete button is clicked', () => {
			const onConfirm = vi.fn();
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={onConfirm}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

			expect(onConfirm).toHaveBeenCalledTimes(1);
		});

		it('should call onClose when backdrop is clicked', () => {
			const onClose = vi.fn();
			const { container } = render(
				<DeleteUserDialog
					isOpen={true}
					onClose={onClose}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			// Click the backdrop (fixed inset-0 div)
			const backdrop = container.querySelector('.fixed.inset-0');
			expect(backdrop).toBeInTheDocument();

			if (backdrop) {
				fireEvent.click(backdrop);
				expect(onClose).toHaveBeenCalledTimes(1);
			}
		});

		it('should call onClose when Escape key is pressed', () => {
			const onClose = vi.fn();
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={onClose}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			fireEvent.keyDown(document, { key: 'Escape' });

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('should not call onClose when other keys are pressed', () => {
			const onClose = vi.fn();
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={onClose}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			fireEvent.keyDown(document, { key: 'Enter' });

			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('should have proper ARIA attributes', () => {
			render(
				<DeleteUserDialog
					isOpen={true}
					onClose={vi.fn()}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			const dialog = screen.getByRole('alertdialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
			expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
			expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
		});

		it('should stop propagation when clicking dialog content', () => {
			const onClose = vi.fn();
			const { container } = render(
				<DeleteUserDialog
					isOpen={true}
					onClose={onClose}
					onConfirm={vi.fn()}
					username="testuser"
					isCurrentUser={false}
				/>,
			);

			// Click the dialog content (not the backdrop)
			const dialogContent = container.querySelector('.bg-white.rounded-3xl');
			expect(dialogContent).toBeInTheDocument();

			if (dialogContent) {
				fireEvent.click(dialogContent);
				expect(onClose).not.toHaveBeenCalled();
			}
		});
	});
});
