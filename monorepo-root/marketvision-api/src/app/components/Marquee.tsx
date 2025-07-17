import React from 'react';

import type { MockHourlyCheapestItem } from '../types/market';

interface MarqueeProps {
  products: MockHourlyCheapestItem[];
}

const Marquee: React.FC<MarqueeProps> = ({ products }) => (
  <div className="w-full bg-black/30 dark:bg-[#23272F]/30 text-white py-2 px-4 overflow-hidden relative flex items-center" style={{minHeight: '40px'}}>
    <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-10" style={{background: 'linear-gradient(90deg, rgba(24,26,32,0.8) 0%, rgba(24,26,32,0.0) 10%, rgba(24,26,32,0.0) 90%, rgba(24,26,32,0.8) 100%)'}}></div>
    <div className="whitespace-nowrap flex gap-8 animate-marquee" style={{animation: 'marquee 160s linear infinite'}}>
      {products.map((t, i) => {
        const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
        return (
          <span key={t.name + '-' + i} className="flex items-center gap-2 opacity-90">
            <span className="text-gray-200 dark:text-gray-300">{t.name}</span>
            <span className="text-gray-300 dark:text-gray-400">{t.price.toLocaleString()}₽</span>
            <span className={percent >= 0 ? "text-green-400" : "text-red-400"}>
              {percent > 0 ? "+" : ""}{percent.toFixed(1)}%
            </span>
          </span>
        );
      })}
      {products.map((t, i) => {
        const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
        return (
          <span key={t.name + '-dup-' + i} className="flex items-center gap-2 opacity-90">
            <span className="text-gray-200 dark:text-gray-300">{t.name}</span>
            <span className="text-gray-300 dark:text-gray-400">{t.price.toLocaleString()}₽</span>
            <span className={percent >= 0 ? "text-green-400" : "text-red-400"}>
              {percent > 0 ? "+" : ""}{percent.toFixed(1)}%
            </span>
          </span>
        );
      })}
    </div>
  </div>
);

export default Marquee; 