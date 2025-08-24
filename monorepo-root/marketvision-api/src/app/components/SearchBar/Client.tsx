"use client";
import React, { useEffect, useRef, useState } from 'react';

import { SearchIcon, ArrowLeftIcon } from '../Icons';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Client({ value, onChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScroll = () => setIsOpen(false);

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current == null) return;
      const dy = e.touches[0]?.clientY - touchStartY.current;
      if (dy > 20) setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll as any);
      window.removeEventListener('touchstart', handleTouchStart as any);
      window.removeEventListener('touchmove', handleTouchMove as any);
    };
  }, [isOpen]);

  return (
    <div className="sidebar__search" ref={wrapperRef}>
      <div className={`searchbar ${isOpen ? 'searchbar--open' : ''}`}>
        <div className="searchbar__header">
          <div className="searchbar__brand">Market Vision</div>
          <button
            type="button"
            className="searchbar__toggle"
            aria-label={isOpen ? 'Закрыть поиск' : 'Открыть поиск'}
            onClick={() => setIsOpen((p) => !p)}
          >
            <SearchIcon />
          </button>
        </div>

        <div className={`sidebar__search-container ${isFocused ? 'sidebar__search-container--focused' : ''}`} aria-hidden={!isOpen}>
          <button
            type="button"
            className="searchbar__back"
            aria-label="Закрыть поиск"
            onClick={() => {
              setIsOpen(false);
              inputRef.current?.blur();
            }}
          >
            <ArrowLeftIcon size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск по запросам"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="sidebar__search-input"
          />
        </div>
      </div>
    </div>
  );
}


