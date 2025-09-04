"use client";

import ReactECharts from 'echarts-for-react';
import React, { useMemo, useState } from 'react';

import { formatPrice, RUBLE } from '../../utils/currency';


type Point = { price: number | null; created_at: string };

type Period = 'day' | 'month' | 'year';

export default function PriceHistoryChart({ data, query, source }: { data: Point[]; query?: string; source?: string }) {
  const [period, setPeriod] = useState<Period>('day');

  const sorted = useMemo(() => {
    return [...data]
      .filter((p) => p && p.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [data]);

  const labelStepHours = useMemo(() => {
    if (period !== 'day' || sorted.length === 0) return 1;
    const last = new Date(sorted[sorted.length - 1].created_at);
    const endHour = Math.max(1, last.getHours());
    // целимся примерно в 5 меток
    return Math.max(1, Math.ceil(endHour / 5));
  }, [period, sorted]);

  const option = useMemo(() => {

    const seriesData = sorted
      .filter((p) => typeof p.price === 'number')
      .map((p) => [new Date(p.created_at).getTime(), Math.round(p.price as number)]);

    let xMin: number | undefined;
    let xMax: number | undefined;
    if (period === 'day' && sorted.length > 0) {
      const firstTs = new Date(sorted[0].created_at);
      const lastTs = new Date(sorted[sorted.length - 1].created_at);
      // Начинаем с первого времени данных, а не с начала дня
      xMin = firstTs.getTime();
      xMax = lastTs.getTime();
    }

    return {
      animation: false,
      grid: { left: 40, right: 12, top: 10, bottom: 25 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: number) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽',
      },
      xAxis: {
        type: 'time',
        min: xMin,
        max: xMax,
        axisLabel: {
          color: '#9CA3AF',
          formatter: (value: number) => {
            const d = new Date(value);
            if (period === 'day') {
              const hour = d.getHours();
              // Показываем ~5 меток за день по шагу labelStepHours
              if (hour % labelStepHours !== 0) return '';
              const hh = String(hour).padStart(2, '0');
              return `${hh}:00`;
            }
            return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(d);
          },
        },
        axisLine: { lineStyle: { color: '#374151' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { 
          color: '#9CA3AF', 
          formatter: (v: number) => {
            const abs = Math.abs(v);
            if (abs >= 1000) {
              return `${Math.round(v / 1000)}к`;
            }
            return String(Math.round(v));
          }
        },
        splitLine: { lineStyle: { color: 'rgba(156,163,175,0.2)' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          lineStyle: { width: 2, color: '#60a5fa' },
          itemStyle: { color: '#60a5fa' },
          areaStyle: { color: 'rgba(96,165,250,0.08)' },
          data: seriesData,
        },
      ],
    } as const;
  }, [sorted, period, labelStepHours]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    []
  );

  const listData = useMemo(
    () =>
      [...sorted]
        .reverse()
        .filter((p) => typeof p.price === 'number')
        .map((p) => ({
          date: dateFormatter.format(new Date(p.created_at)),
          price: Math.round(p.price as number),
        })),
    [sorted, dateFormatter]
  );

  const queryClass = source ? `priceHistory__query priceHistory__query_${source}` : 'priceHistory__query';
  const activeBtnClass = source
    ? `priceHistory__period-btn--active priceHistory__period-btn--active_${source}`
    : 'priceHistory__period-btn--active';

  return (
    <div className="priceHistory">
      <div className="priceHistory__header">
        <span className="priceHistory__title">История цен</span>
        <br />
        {query ? (
          <p className="priceHistory__subtitle">
            по запросу: <span className={queryClass}>{query}</span>
          </p>
        ) : null}
      </div>
      <div className="priceHistory__periods">
        <button
          type="button"
          className={`priceHistory__period-btn ${period === 'day' ? activeBtnClass : ''}`}
          onClick={() => setPeriod('day')}
        >
          День
        </button>
        <button type="button" className="priceHistory__period-btn" disabled>
          Месяц
        </button>
        <button type="button" className="priceHistory__period-btn" disabled>
          Год
        </button>
      </div>
      <ReactECharts
        option={option}
        className="chart"
        notMerge
        lazyUpdate
        style={{ width: '100%', height: 260 }}
      />
      <ul className="priceHistory__list">
        {listData.map((item, index) => (
          <li key={index} className="priceHistory__item">
            <span className="priceHistory__date">{item.date}</span>
            <span className="priceHistory__price">{formatPrice(item.price)} {RUBLE}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

