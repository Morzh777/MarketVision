'use client';

import { useState, useRef } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена'
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    confirmText: string = 'Подтвердить',
    cancelText: string = 'Отмена'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText
      });
    });
  };

  const handleCancel = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  const handleConfirm = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  };

  return {
    dialogState,
    showConfirm,
    handleCancel,
    handleConfirm
  };
};
