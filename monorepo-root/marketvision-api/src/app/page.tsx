"use client";
import React, { useState, useEffect } from "react";
import ReactECharts from 'echarts-for-react';
import { FaRegCalendarAlt, FaRegCalendar, FaRegCalendarCheck, FaRegClock } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { testProductsData, mockDeals, Timeframe, recommendedPrice2024 } from './testData';
import { priceHistoryMap } from './testPriceHistoryData';

// Тип для mockHourlyCheapest с дополнительным полем qwerty
interface MockHourlyCheapestItem {
  hour: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  marketPriceNote?: string;
  qwerty?: string;
  recommended?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

// Удаляю все определения testProductsData, mockDeals, chartData, PriceStats, Timeframe, а также их типы и дублирующие данные.

const timeframes = [
  { key: 'day' as Timeframe, label: 'День', icon: <FaRegClock /> },
  { key: 'week' as Timeframe, label: 'Неделя', icon: <FaRegCalendarCheck /> },
  { key: 'month' as Timeframe, label: 'Месяц', icon: <FaRegCalendar /> },
  { key: 'year' as Timeframe, label: 'Год', icon: <FaRegCalendarAlt /> },
];

export default function Home() {
  const [selected, setSelected] = useState(testProductsData[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('day');

  // Получаем историю цен для выбранного товара и таймфрейма
  const priceHistory = priceHistoryMap[selected.qwerty ?? '']?.[timeframe] || [];
  const recommended = recommendedPrice2024[selected.qwerty ?? ''] || null;

  // Формируем данные для графика
  const chartLabels = priceHistory.map(item =>
    timeframe === 'day'
      ? item.created_at.slice(11, 16)
      : timeframe === 'year'
      ? item.created_at.slice(0, 7)
      : item.created_at.slice(5, 10)
  );
  const currentPrices = priceHistory.map(item => Number(item.price));
  const recommendedPrices = priceHistory.map(() => recommended);

  // Следим за актуальностью выбранного товара
  useEffect(() => {
    if (!testProductsData.find((item) => item.name === selected.name)) {
      setSelected(testProductsData[0]);
    }
  }, [testProductsData, selected]);

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#23272F',
      borderColor: '#23272F',
      textStyle: {
        color: '#fff',
        fontWeight: 500,
        fontSize: 14,
      },
      extraCssText: 'box-shadow: 0 2px 8px #000a; border-radius: 8px;',
      formatter: (params: any) => {
        let html = `<div style='font-size:15px;font-weight:600;'>${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          if (p.seriesName === 'Текущая') {
            html += `<div style='margin-top:4px; color:#3b82f6;'>Текущая: <b>${p.value.toLocaleString()}₽</b></div>`;
          }
          if (p.seriesName === 'Рекомендуемая') {
            html += `<div style='margin-top:4px; color:#a855f7;'>Рекомендуемая: <b>${p.value.toLocaleString()}₽</b></div>`;
          }
          if (p.seriesName === 'Рыночная цена') {
            html += `<div style='margin-top:4px; color:#f59e42;'>Рыночная цена: <b>${p.value.toLocaleString()}₽</b></div>`;
          }
        });
        return html;
      },
    },
    grid: { left: 40, right: 20, top: 40, bottom: 50 },
    xAxis: {
      type: 'category',
      data: chartLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#aaa' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'inherit',
        margin: 12,
        formatter: (value: number) => value >= 1000 ? `${Math.round(value/1000)}к` : value,
      },
      splitLine: { lineStyle: { color: '#23272F' } },
    },
    legend: {
      show: true,
      data: [
        { name: 'Текущая', icon: 'path://M4,8 L28,8 M16,8 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0' },
        'Рекомендуемая',
        'Рыночная цена',
      ],
      top: 0,
      left: 'center',
      textStyle: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 15,
      },
      itemWidth: 32,
      itemHeight: 16,
    },
    series: [
      {
        name: 'Текущая',
        type: 'line',
        data: currentPrices,
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#3b82f6' },
        symbol: 'circle',
        symbolSize: 8,
        z: 10,
        areaStyle: { color: 'rgba(59,130,246,0.10)' },
      },
      recommended && {
        name: 'Рекомендуемая',
        type: 'line',
        data: recommendedPrices,
        lineStyle: { color: '#a855f7', type: 'dashed', width: 2 },
        itemStyle: { color: '#a855f7' },
        symbol: 'none',
        z: 5,
      },
      selected.mean && {
        name: 'Рыночная цена',
        type: 'line',
        data: priceHistory.map(() => selected.mean),
        lineStyle: { color: '#f59e42', type: 'dotted', width: 2 },
        itemStyle: { color: '#f59e42' },
        symbol: 'none',
        z: 4,
      },
    ].filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181A20] flex flex-col transition-colors duration-300">
      {/* Бегущая строка: прозрачная, бесконечная анимация */}
      <div className="w-full bg-black/30 dark:bg-[#23272F]/30 text-white py-2 px-4 overflow-hidden relative flex items-center" style={{minHeight: '40px'}}>
        <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-10" style={{background: 'linear-gradient(90deg, rgba(24,26,32,0.8) 0%, rgba(24,26,32,0.0) 10%, rgba(24,26,32,0.0) 90%, rgba(24,26,32,0.8) 100%)'}}></div>
        <div className="whitespace-nowrap flex gap-8 animate-marquee" style={{animation: 'marquee 160s linear infinite'}}>
          {testProductsData.map((t, i) => {
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
          {/* Дублируем для бесконечной прокрутки */}
          {testProductsData.map((t, i) => {
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
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Плавная прокрутка для SimpleBar */
        .custom-simplebar .simplebar-content-wrapper {
          scroll-behavior: smooth;
        }
      `}</style>
      {/* Основная сетка */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_320px] h-screen">
        {/* Левый сайдбар */}
        <div className="hidden md:flex flex-col h-full bg-white dark:bg-[#20232B] border-r border-gray-200 dark:border-[#23272F]">
          <SimpleBar className="custom-simplebar flex-1 min-h-0" style={{ height: '100%', maxHeight: '100%' }}>
            <div>
              <h2 className="p-4 pb-2 font-bold text-lg text-gray-800 dark:text-gray-100">Кверти</h2>
              <ul>
                {testProductsData.map((t) => {
                  const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
                  return (
                    <li
                      key={t.name}
                      className={`px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-[#23272F] transition ${selected.name === t.name ? "bg-blue-50 dark:bg-[#23272F]" : ""}`}
                      onClick={() => setSelected(t)}
                    >
                      <span className="text-gray-800 dark:text-gray-100">{t.qwerty}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-gray-700 dark:text-gray-300">{t.price.toLocaleString()}₽</span>
                        <span className={percent >= 0 ? "text-green-400" : "text-red-400"}>
                          {percent > 0 ? "+" : ""}{percent.toFixed(1)}%
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </SimpleBar>
          <div className="p-4 border-t border-gray-200 dark:border-[#23272F] bg-gray-50 dark:bg-[#181A20]">
            <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-200">Выгодные предложения</h3>
            <ul className="space-y-1">
              {mockDeals.map((deal) => (
                <li key={deal.id} className="flex justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-200">{deal.title}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{deal.price.toLocaleString()}₽</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Центральный блок */}
        <SimpleBar className="custom-simplebar flex flex-col h-full min-w-0" style={{ maxHeight: '100vh', height: '100vh' }}>
          <div className="bg-white dark:bg-[#23272F] rounded shadow p-4 sm:p-8 w-full flex flex-col items-center justify-start transition-colors duration-300" style={{ minHeight: 320 }}>
            {/* Переключатель таймфрейма с иконками */}
            <div className="flex gap-2 mb-4 w-full justify-center flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded font-medium text-sm transition-colors border border-transparent ${timeframe === tf.key ? 'bg-blue-600 text-white' : 'bg-[#23272F] text-gray-200 hover:bg-[#3a3f4a]'}`}
                >
                  {tf.icon} {tf.label}
                </button>
              ))}
            </div>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 w-full text-left">График цены</h2>
            <ReactECharts
              option={chartOption}
              style={{ height: 'min(60vw,400px)', width: '100%', minHeight: 220, maxHeight: 400 }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </SimpleBar>
        {/* Правый сайдбар */}
        <SimpleBar className="custom-simplebar hidden lg:flex w-full max-w-[340px] flex-col h-full bg-white dark:bg-[#20232B] border-l border-gray-200 dark:border-[#23272F] transition-colors duration-300" style={{ maxHeight: '100vh', height: '100vh' }}>
          <div className="p-4 border-b border-gray-200 dark:border-[#23272F]">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Самые дешёвые товары</h3>
            <ul className="space-y-3">
              {testProductsData.map((item, idx) => (
                <li key={idx} className="flex flex-col gap-2 bg-gray-50 dark:bg-[#23272F] rounded p-3 shadow-sm">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.source === "wb" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>{item.source === "wb" ? "WB" : "OZON"}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.hour}</span>
                    </div>
                  </div>
                  <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded bg-white dark:bg-[#181A20] border border-gray-200 dark:border-[#23272F]" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">{item.price.toLocaleString()}₽</span>
                    {item.marketPriceNote && (
                      <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-green-500 bg-green-500/10">Ниже рынка</span>
                    )}
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-center bg-[#2d323c] hover:bg-[#3a3f4a] active:bg-[#23272F] text-white font-medium px-4 py-1.5 rounded transition-colors duration-200 text-sm border border-transparent shadow-sm"
                  >
                    В магазин
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </SimpleBar>
      </div>
      {/* Добавляю глобальные стили для автоскрытия скроллбара */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #23272F;
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        /* SimpleBar кастомизация: скроллбар только при наведении */
        .simplebar-scrollbar {
         
          border-radius: 8px;
          opacity: 1 !important;
          transition: none;
        }
        .simplebar-track {
          background: transparent !important;
        }
        .custom-simplebar .simplebar-scrollbar {
          opacity: 0 !important;
          transition: opacity 0.2s;
        }
        .custom-simplebar:hover .simplebar-scrollbar,
        .custom-simplebar.simplebar-dragging .simplebar-scrollbar,
        .custom-simplebar .simplebar-scrollbar.simplebar-visible {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
