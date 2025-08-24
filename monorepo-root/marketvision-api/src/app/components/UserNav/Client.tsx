"use client";
import { useRouter } from 'next/navigation';
import React from 'react';

import { HeartIcon, HomeIcon, QuestionIcon } from '../Icons';

export interface Props {
  onHelpClick?: () => void;
}

export default function Client({ onHelpClick }: Props) {
  const router = useRouter();

  return (
    <nav className="sidebar__usernav" aria-label="User navigation">
      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Избранное"
        onClick={() => router.push('/favorites')}
      >
        <HeartIcon size={20} />
      </button>

      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Справка"
        onClick={onHelpClick || (() => router.push('/help'))}
      >
        <QuestionIcon size={20} />
      </button>

      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Главная"
        onClick={() => router.push('/')}
      >
        <HomeIcon size={20} />
      </button>
    </nav>
  );
}


