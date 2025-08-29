"use client";
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { HeartIcon, HomeIcon, HomeSolidIcon, QuestionIcon } from '../Icons';

export interface Props {
  onHelpClick?: () => void;
}

export default function Client({ onHelpClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [homePressed, setHomePressed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const goHome = (): void => {
    try {
      sessionStorage.removeItem('sidebarSelectedCategory');
      sessionStorage.removeItem('sidebarSearchQuery');
      sessionStorage.removeItem('popularQueriesCache');
      sessionStorage.removeItem('sidebarShowFavoritesOnly'); // Добавляем сброс фильтра избранного
    } catch {}

    if (typeof window !== 'undefined') {
      // Получаем telegram_id для передачи на главную
      const telegramId = localStorage.getItem('telegram_id') || 
                        document.cookie.split('; ').find(row => row.startsWith('telegram_id_client='))?.split('=')[1];
      
      // Если мы на главной с фильтром favorites, убираем его
      if (window.location.pathname === '/' && window.location.search.includes('filter=favorites')) {
        const newUrl = telegramId ? `/?telegram_id=${telegramId}` : '/';
        window.location.href = newUrl;
        return;
      }
      
      if (window.location.pathname === '/') {
        window.location.reload();
      } else {
        const newUrl = telegramId ? `/?telegram_id=${telegramId}` : '/';
        window.location.assign(newUrl);
      }
      return;
    }

    // Fallback для SSR
    const telegramId = typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null;
    if (telegramId) {
      router.replace(`/?telegram_id=${telegramId}`);
    } else {
      router.replace('/');
    }
    router.refresh();
  };

  const openHelp = (): void => {
    if (onHelpClick) onHelpClick();
    setIsHelpOpen(true);
  };

  const closeHelp = (): void => setIsHelpOpen(false);

  return (
    <nav className="sidebar__usernav" aria-label="User navigation">
      <button
        type="button"
        className={`sidebar__usernav-btn${isHome ? ' sidebar__usernav-btn--active' : ''}`}
        aria-label="Главная"
        onPointerDown={() => setHomePressed(true)}
        onPointerUp={() => setHomePressed(false)}
        onPointerCancel={() => setHomePressed(false)}
        onBlur={() => setHomePressed(false)}
        onClick={goHome}
      >
        {homePressed || isHome ? <HomeSolidIcon size={20} /> : <HomeIcon size={20} />}
      </button>

      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Избранное"
        onClick={() => {
          // Получаем telegram_id для передачи на страницу избранного
          let telegramId = null;
          if (typeof window !== 'undefined') {
            telegramId = localStorage.getItem('telegram_id') || 
                         document.cookie.split('; ').find(row => row.startsWith('telegram_id_client='))?.split('=')[1];
          }
          
          const favoritesUrl = telegramId ? 
            `/?filter=favorites&telegram_id=${telegramId}` : 
            '/?filter=favorites';
          
          console.log('🔍 UserNav: Переход на избранное с telegram_id:', telegramId, 'URL:', favoritesUrl);
          router.push(favoritesUrl);
        }}
      >
        <HeartIcon size={20} />
      </button>

      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Справка"
        onClick={openHelp}
      >
        <QuestionIcon size={20} />
      </button>

      {isHelpOpen && (
        <div className="usernav-help__overlay" role="dialog" aria-modal="true" onClick={closeHelp}>
          <div className="usernav-help__sheet" onClick={(e) => e.stopPropagation()}>
            <div className="usernav-help__header">
              <span className="usernav-help__title">О сервисе</span>
              <button type="button" className="usernav-help__close" aria-label="Закрыть" onClick={closeHelp}>✕</button>
            </div>
            <div className="usernav-help__body">
              <p>MarketVision — аналитика цен по маркетплейсам. Сохраняем историю, считаем рыночную стоимость и динамику.</p>
              <ul className="usernav-help__links">
                <li><a href="https://t.me/" target="_blank" rel="noopener noreferrer">Telegram</a></li>
                <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">X / Twitter</a></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


