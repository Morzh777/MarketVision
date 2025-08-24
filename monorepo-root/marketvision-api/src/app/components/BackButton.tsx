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
      router.push('/');
    }
  };

  return (
    <button type="button" className={className} aria-label={ariaLabel || 'Назад'} onClick={handleBack}>
      {children}
    </button>
  );
}


