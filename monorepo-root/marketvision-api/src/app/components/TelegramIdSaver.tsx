"use client";

import { useEffect } from 'react';

interface Props {
  telegram_id?: string;
}

export default function TelegramIdSaver({ telegram_id }: Props) {
  useEffect(() => {
    if (telegram_id && typeof window !== 'undefined') {
      console.log('🔧 TelegramIdSaver: Сохраняю telegram_id в localStorage:', telegram_id);
      localStorage.setItem('telegram_id', telegram_id);
      
      // Также устанавливаем cookie для совместимости
      document.cookie = `telegram_id_client=${telegram_id}; path=/; max-age=${60 * 60 * 24 * 7}`;
      
      console.log('✅ TelegramIdSaver: telegram_id сохранен в localStorage и cookie');
    }
  }, [telegram_id]);

  // Этот компонент ничего не рендерит
  return null;
}
