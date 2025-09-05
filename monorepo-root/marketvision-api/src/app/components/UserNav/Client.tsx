"use client";
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { HeartIcon, HeartSolidIcon, HomeIcon, HomeSolidIcon, QuestionIcon } from '../Icons';

export interface Props {
  onHelpClick?: () => void;
}

export default function Client({ onHelpClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [homePressed, setHomePressed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFavoritesActive, setIsFavoritesActive] = useState(false);
  
  // Проверяем, активен ли фильтр избранного
  useEffect(() => {
    const checkFavorites = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const isFavoritesFromURL = urlParams.get('filter') === 'favorites';
        
        // Также проверяем sessionStorage для синхронизации с Sidebar
        const isFavoritesFromStorage = sessionStorage.getItem('sidebarShowFavoritesOnly') === 'true';
        
        setIsFavoritesActive(isFavoritesFromURL || isFavoritesFromStorage);
      }
    };
    
    checkFavorites();
    
    // Слушаем изменения URL
    const handlePopState = () => checkFavorites();
    window.addEventListener('popstate', handlePopState);
    
    // Слушаем изменения sessionStorage для синхронизации с Sidebar
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarShowFavoritesOnly') {
        checkFavorites();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const goHome = (): void => {
    try {
      sessionStorage.removeItem('sidebarSelectedCategory');
      sessionStorage.removeItem('sidebarSearchQuery');
      sessionStorage.removeItem('popularQueriesCache');
      sessionStorage.removeItem('sidebarShowFavoritesOnly'); // Добавляем сброс фильтра избранного
    } catch {}

    // Сбрасываем состояние избранного
    setIsFavoritesActive(false);

    if (typeof window !== 'undefined') {
      // Если мы на главной с фильтром favorites, убираем его
      if (window.location.pathname === '/' && window.location.search.includes('filter=favorites')) {
        window.location.href = '/';
        return;
      }
      
      // Если мы на главной и показываем избранное через sessionStorage, перезагружаем
      if (window.location.pathname === '/' && sessionStorage.getItem('sidebarShowFavoritesOnly') === 'true') {
        window.location.href = '/';
        return;
      }
      
      if (window.location.pathname === '/') {
        window.location.reload();
      } else {
        window.location.assign('/');
      }
      return;
    }

    // Fallback для SSR
    router.replace('/');
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
        className="sidebar__usernav-btn"
        aria-label="Главная"
        onPointerDown={() => setHomePressed(true)}
        onPointerUp={() => setHomePressed(false)}
        onPointerCancel={() => setHomePressed(false)}
        onBlur={() => setHomePressed(false)}
        onClick={goHome}
      >
        {homePressed || (isHome && !isFavoritesActive) ? <HomeSolidIcon size={20} /> : <HomeIcon size={20} />}
      </button>

      <button
        type="button"
        className="sidebar__usernav-btn"
        aria-label="Избранное"
        onClick={() => {
          setIsFavoritesActive(true);
          router.push('/?filter=favorites');
        }}
      >
        {isFavoritesActive ? <HeartSolidIcon size={20} /> : <HeartIcon size={20} />}
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


