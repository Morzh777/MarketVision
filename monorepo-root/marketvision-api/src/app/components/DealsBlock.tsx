import React from 'react';
import type { MockHourlyCheapestItem } from '../types/market';

interface DealsBlockProps {
  products: MockHourlyCheapestItem[];
}

const DealsBlock: React.FC<DealsBlockProps> = ({ products }) => (
  <div className="p-4 border-b border-gray-200 dark:border-[#23272F]">
    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 ">Выгодные предложения</h3>
    <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">на 12:00 12.января.2025</p>
    <ul className="space-y-3">
      {products.map((item, idx) => (
        <li key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-[#23272F] rounded p-3 shadow-sm">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center w-full gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.source === "wb" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>{item.source === "wb" ? "WB" : "OZON"}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.hour}</span>
              {item.marketPriceNote && (
                <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-green-500 bg-green-500/10">Ниже рынка</span>
              )}
            </div>
          </div>
          <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded bg-white dark:bg-[#181A20] border border-gray-200 dark:border-[#23272F]" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{item.name}</span>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={
              `mt-2 inline-block text-center font-bold px-4 py-1.5 rounded transition-colors duration-200 text-sm border border-transparent shadow-sm ` +
              (item.source === "wb"
                ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white")
            }
          >
            {item.price.toLocaleString()} ₽
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default DealsBlock; 