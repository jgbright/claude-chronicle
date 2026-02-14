import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from './Toast';
import type { Toast } from './useToast';

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container.querySelector('.toast-container')).toBeNull();
  });

  it('renders toast messages', () => {
    const toasts: Toast[] = [
      { id: 't1', message: 'Message hidden' },
      { id: 't2', message: 'Annotation added' },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Message hidden')).toBeInTheDocument();
    expect(screen.getByText('Annotation added')).toBeInTheDocument();
  });

  it('renders Undo button when onUndo is provided', () => {
    const toasts: Toast[] = [
      { id: 't1', message: 'Message hidden', onUndo: vi.fn() },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('does not render Undo button when onUndo is not provided', () => {
    const toasts: Toast[] = [
      { id: 't1', message: 'Annotation added' },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  });

  it('calls onUndo and onDismiss when Undo is clicked', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onDismiss = vi.fn();
    const toasts: Toast[] = [
      { id: 't1', message: 'Hidden', onUndo },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    await user.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('t1');
  });

  it('calls onDismiss when close button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const toasts: Toast[] = [
      { id: 't1', message: 'Test' },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    await user.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledWith('t1');
  });
});
