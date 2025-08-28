"use client";
import { useEffect } from 'react';

import { ApiService } from '@/app/services/apiService';

export default function Boot(): null {
  useEffect(() => {
    try {
      const anyWindow = window as unknown as { Telegram?: any };
      const tgUser = anyWindow?.Telegram?.WebApp?.initDataUnsafe?.user;
      const idFromTelegram: string | null = tgUser?.id ? String(tgUser.id) : null;
      const fromQuery = new URLSearchParams(window.location.search).get('dev_telegram_id');
      const stored = localStorage.getItem('telegram_id');
      const fromEnv = (process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID as string | undefined) || '171989';
      const telegram_id = idFromTelegram || fromQuery || stored || fromEnv;

      if (telegram_id && stored !== telegram_id) {
        try { localStorage.setItem('telegram_id', telegram_id); } catch {}
      }
    } catch {
      // ignore
    }
  }, []);

  return null;
}


