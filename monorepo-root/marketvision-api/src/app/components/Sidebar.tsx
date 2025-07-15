import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import type { MockHourlyCheapestItem } from '../types/market';

interface SidebarProps {
  products: MockHourlyCheapestItem[];
  selected: MockHourlyCheapestItem;
  onSelect: (item: MockHourlyCheapestItem) => void;
  sortOrder: 'asc' | 'desc' | null;
  sortPercentOrder: 'asc' | 'desc' | null;
  onSortPrice: () => void;
  onSortPercent: () => void;
  deals: { id: number; title: string; price: number }[];
}

const Sidebar: React.FC<SidebarProps> = ({ products, selected, onSelect, sortOrder, sortPercentOrder, onSortPrice, onSortPercent, deals }) => (
  <div className="hidden md:flex flex-col h-full bg-white dark:bg-[#20232B] border-r border-gray-200 dark:border-[#23272F]">
    <SimpleBar className="custom-simplebar flex-1 min-h-0" style={{ height: '100%', maxHeight: '100%' }}>
      <div>
        <div className="px-4 py-1 grid grid-cols-[1fr_80px_60px] gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#23272F] mb-1 select-none" aria-label="Заголовки столбцов популярных запросов">
          <span className="min-w-[80px]">Популярные запросы</span>
          <span className={`w-20 flex items-center gap-1 cursor-pointer select-none ${sortOrder ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} onClick={onSortPrice} title="Сортировать по цене" style={{whiteSpace: 'nowrap'}}>
            {/* SVG-иконки сортировки */}
            {/* ... */}
            <span>Мин. цена</span>
          </span>
          <span className={`min-w-[60px] flex items-center gap-1 cursor-pointer select-none ${sortPercentOrder ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} onClick={onSortPercent} title="Сортировать по изменению %" style={{whiteSpace: 'nowrap'}}>
            {/* SVG-иконки сортировки */}
            {/* ... */}
            <span>Изм. %</span>
          </span>
        </div>
        <ul>
          {products.map((t) => {
            const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
            return (
              <li key={t.name} className={`px-4 py-2 cursor-pointer grid grid-cols-[1fr_80px_60px] gap-3 items-center hover:bg-gray-100 dark:hover:bg-[#23272F] transition ${selected.name === t.name ? "bg-blue-50 dark:bg-[#23272F]" : ""}`} onClick={() => onSelect(t)}>
                <span className="text-gray-800 dark:text-gray-100 truncate">{t.qwerty}</span>
                <span className="font-mono text-gray-700 dark:text-gray-300 text-right">{t.price.toLocaleString()}₽</span>
                <span className={`text-right min-w-[60px] ${percent >= 0 ? "text-green-400" : "text-red-400"}`}>{percent > 0 ? "+" : ""}{percent.toFixed(1)}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </SimpleBar>
    <div className="p-4 border-t border-gray-200 dark:border-[#23272F] bg-gray-50 dark:bg-[#181A20]">
      <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-200">Выгодные предложения</h3>
      <p className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-200">на 12.01.2025</p>
      <ul className="space-y-1">
        {deals.map((deal) => (
          <li key={deal.id} className="flex justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-200">{deal.title}</span>
            <span className="font-mono text-blue-600 dark:text-blue-400">{deal.price.toLocaleString()}₽</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Sidebar; 