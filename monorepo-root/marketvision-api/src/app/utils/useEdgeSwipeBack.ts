"use client";

import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import { useSwipeable, SwipeableHandlers } from 'react-swipeable';

export interface EdgeSwipeOptions {
  leftEdge?: number;        // активная зона слева (px)
  rightEdge?: number;       // активная зона справа (px)
  minDistance?: number;     // минимальное смещение по X (px)
  allowRightEdge?: boolean; // обрабатывать свайп слева-направо от правого края
}

/**
 * Хук для возврата на предыдущую страницу по свайпу у края экрана
 * Возвращает объект с обработчиками и ref для корневого контейнера
 */
export function useEdgeSwipeBack(options: EdgeSwipeOptions = {}): { handlers: SwipeableHandlers; ref: React.RefObject<HTMLElement | null> } {
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const EDGE_ZONE = options.leftEdge ?? 36;
  const RIGHT_EDGE_ZONE = options.rightEdge ?? 36;
  const MIN_DISTANCE = options.minDistance ?? 20;
  const ALLOW_RIGHT_EDGE = options.allowRightEdge ?? false;

  // Функция для добавления CSS классов анимации
  const addSwipeClass = useCallback((className: string) => {
    if (containerRef.current) {
      containerRef.current.classList.add(className);
    }
  }, []);

  // Функция для удаления CSS классов анимации
  const removeSwipeClasses = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.classList.remove('swipe-left', 'swipe-right', 'swipe-reset');
    }
  }, []);

  // Функция для сброса анимации
  const resetSwipeAnimation = useCallback(() => {
    if (containerRef.current) {
      removeSwipeClasses();
      containerRef.current.classList.add('swipe-reset');
      setTimeout(() => {
        removeSwipeClasses();
      }, 300);
    }
  }, [removeSwipeClasses]);

  const handlers = useSwipeable({
    onSwipedRight: (e) => {
      const [startX] = e.initial;
      if (startX <= EDGE_ZONE && e.absX >= MIN_DISTANCE && e.absY < 50) {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
      }
      resetSwipeAnimation();
    },
    onSwipedLeft: (e) => {
      if (!ALLOW_RIGHT_EDGE) return;
      const [startX] = e.initial;
      if (typeof window === 'undefined') return;
      const fromRight = window.innerWidth - startX <= RIGHT_EDGE_ZONE;
      if (fromRight && e.absX >= MIN_DISTANCE && e.absY < 50) {
        if (window.history.length > 1) router.back();
        else router.push('/');
      }
      resetSwipeAnimation();
    },
    onSwiping: (e) => {
      const [startX] = e.initial;
      const deltaX = e.deltaX;
      
      // Анимация оттягивания при свайпе
      if (startX <= EDGE_ZONE) {
        removeSwipeClasses();
        if (deltaX > 0) {
          // Свайп вправо от левого края
          addSwipeClass('swipe-right');
        } else if (deltaX < 0) {
          // Свайп влево от левого края
          addSwipeClass('swipe-left');
        }
      }
    },
    onSwiped: () => {
      // Сброс анимации после завершения свайпа
      resetSwipeAnimation();
    },
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  return { handlers, ref: containerRef };
}


