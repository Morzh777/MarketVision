import ReactECharts from 'echarts-for-react';
import React from 'react';

import styles from '../styles/components/chart-block.module.scss';
import type { MockHourlyCheapestItem, Timeframe } from '../types/market';

interface ChartBlockProps {
  selected: MockHourlyCheapestItem;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  priceHistory: Array<{ price: number | null; created_at: string }>;
  recommended: number | null;
}

const timeframes = [
  { key: 'day' as Timeframe, label: 'День' },
  { key: 'week' as Timeframe, label: 'Неделя' },
  { key: 'month' as Timeframe, label: 'Месяц' },
  { key: 'year' as Timeframe, label: 'Год' },
];

const ChartBlock: React.FC<ChartBlockProps> = ({ selected, timeframe, setTimeframe, priceHistory, recommended }) => {
  // Функция создания опций графика
  const getChartOption = () => {
    // chartLabels всегда фиксированный массив 00:00-23:00 для day
    const chartLabels = timeframe === 'day'
      ? Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0') + ':00')
      : priceHistory.map(item =>
          timeframe === 'year'
            ? item.created_at.slice(0, 7)
            : item.created_at.slice(5, 10)
        );
    
    // Упрощаем логику данных
    const currentPrices = priceHistory.map(item => item.price);
    
    // Находим последний индекс с валидными данными
    const lastValidIndex = (() => {
      let idx = -1;
      for (let i = 0; i < currentPrices.length; i++) {
        if (currentPrices[i] != null) idx = i;
      }
      return idx;
    })();
    
    // Рекомендуемые цены только до последнего валидного индекса
    const recommendedPrices = currentPrices.map((_, i) => 
      i <= lastValidIndex ? recommended : null
    );
    
    // Рыночные цены только до последнего валидного индекса
    const marketPricesArray = currentPrices.map((_, i) => 
      i <= lastValidIndex ? (selected.mean || 0) : null
    );



    // minY: 10% ниже минимальной цены
    const minY = selected.min ? Math.max(0, Math.floor(selected.min * 0.9)) : 0;
    function shiftValue(val: number | null): number | null {
      if (val == null) return null;
      return val; // Убираем смещение, чтобы данные отображались корректно
    }

    

    const options = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#23272F',
        borderColor: '#888',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontWeight: 500,
          fontSize: 14,
        },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 8px; padding: 8px;',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#888',
            width: 2,
            type: 'dashed'
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const dataIndex = params[0]?.dataIndex || 0;
          const currentPrice = currentPrices[dataIndex];
          const recommendedPrice = recommendedPrices[dataIndex];
          const marketPrice = marketPricesArray[dataIndex];
          const time = params[0]?.axisValue || params.name;
          
          let html = `<div style='font-size:15px;font-weight:600;'>${time}</div>`;
          
          if (currentPrice !== null) {
            html += `<div style='margin-top:4px; color:#3b82f6;'>● Текущая: <b>${currentPrice.toLocaleString()}₽</b></div>`;
          }
          
          if (recommendedPrice !== null && currentPrice !== null) {
            const recommendedDiffPercent = ((currentPrice - recommendedPrice) / recommendedPrice) * 100;
            const recommendedDiffText = recommendedDiffPercent > 0 ? `+${recommendedDiffPercent.toFixed(1)}%` : `${recommendedDiffPercent.toFixed(1)}%`;
            const recommendedColor = recommendedDiffPercent < 0 ? '#10b981' : '#ef4444';
            html += `<div style='margin-top:2px; color:#fbbf24; font-size:12px;'>  └─ Рекомендуемая: ${recommendedPrice.toLocaleString()}₽ <span style='color:${recommendedColor};'>(${recommendedDiffText})</span></div>`;
          }
          
          if (marketPrice !== null && currentPrice !== null) {
            const marketDiffPercent = ((currentPrice - marketPrice) / marketPrice) * 100;
            const marketDiffText = marketDiffPercent > 0 ? `+${marketDiffPercent.toFixed(1)}%` : `${marketDiffPercent.toFixed(1)}%`;
            const marketColor = marketDiffPercent < 0 ? '#10b981' : '#ef4444';
            html += `<div style='margin-top:2px; color:#9333ea; font-size:12px;'>  └─ Рыночная: ${marketPrice.toLocaleString()}₽ <span style='color:${marketColor};'>(${marketDiffText})</span></div>`;
          }
          
          return html;
        },
      },
      grid: { 
        left: 40, 
        right: 20, 
        top: 40, 
        bottom: 50 
      },
      xAxis: {
        type: 'category',
        data: chartLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { color: '#aaa' },
      },
      yAxis: {
        type: 'value',
        min: minY,
        minInterval: 5000,
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: 'inherit',
          margin: 12,
          formatter: (value: number) => value >= 1000 ? `${Math.round(value/1000)}к` : value,
        },
        splitLine: { 
          show: true,
          lineStyle: { 
            color: '#374151', 
            type: 'dashed',
            width: 1
          } 
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: 'Текущая',
          type: 'line',
          data: currentPrices.map(shiftValue),
          lineStyle: { 
            color: '#3b82f6', 
            width: 4 
          },
          itemStyle: { color: '#3b82f6' },
          symbol: 'circle',
          symbolSize: 10,
          symbolHoverSize: 12,
          z: 10,
          areaStyle: { color: 'rgba(59,130,246,0.15)' },
          connectNulls: false,
        },
      ],
    };

    console.log('Chart Options:', {
      legend: options.legend,
      seriesCount: options.series?.length
    });
    return options;
  };

  return (
  <div className={styles.chartBlock}>
    <div className={styles.timeframeButtons}>
      {timeframes.map((tf) => (
        <button
          key={tf.key}
          onClick={() => setTimeframe(tf.key)}
          className={`${styles.timeframeButton} ${
            timeframe === tf.key ? styles['timeframeButton--active'] : styles['timeframeButton--inactive']
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
    <h2 className={styles.title}>
      График цены{selected.qwerty && (
        <span className={styles.productName}>{selected.qwerty}</span>
      )}
    </h2>
    <ReactECharts
      option={getChartOption()}
      className={styles.chart}
      opts={{ renderer: 'canvas' }}
    />
  </div>
  );
};

export default ChartBlock; 