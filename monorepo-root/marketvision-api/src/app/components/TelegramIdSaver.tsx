"use client";

import { useEffect } from 'react';

interface Props {
  telegram_id?: string;
}

export default function TelegramIdSaver({ telegram_id }: Props) {
  useEffect(() => {
    if (telegram_id && typeof window !== 'undefined') {
      localStorage.setItem('telegram_id', telegram_id);
      
      // Также устанавливаем cookie для совместимости
      document.cookie = `telegram_id_client=${telegram_id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }, [telegram_id]);

  // Этот компонент ничего не рендерит
  return null;
}
