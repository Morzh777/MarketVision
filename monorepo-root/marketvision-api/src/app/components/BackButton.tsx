"use client";

import { useRouter } from 'next/navigation';
import React from 'react';

interface Props {
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

export default function BackButton({ className, ariaLabel, children }: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // При переходе на главную передаем telegram_id если он есть
      const telegramId = localStorage.getItem('telegram_id') || 
                        document.cookie.split('; ').find(row => row.startsWith('telegram_id_client='))?.split('=')[1];
      
      if (telegramId) {
        router.push(`/?telegram_id=${telegramId}`);
      } else {
        router.push('/');
      }
    }
  };

  return (
    <button type="button" className={className} aria-label={ariaLabel || 'Назад'} onClick={handleBack}>
      {children}
    </button>
  );
}


