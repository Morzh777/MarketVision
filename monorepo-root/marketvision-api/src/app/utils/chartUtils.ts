import type { MockHourlyCheapestItem, Timeframe } from '../types/market';

export function getChartOption(
  selected: MockHourlyCheapestItem,
  priceHistory: any[],
  recommended: number | null,
  marketPrices: number[],
  timeframe: Timeframe
) {
  // chartLabels всегда фиксированный массив 00:00-23:00 для day
  const chartLabels = timeframe === 'day'
    ? Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0') + ':00')
    : priceHistory.map(item =>
        timeframe === 'year'
          ? item.created_at.slice(0, 7)
          : item.created_at.slice(5, 10)
      );
  const currentPrices = priceHistory.map(item => item.price);
  const lastValidIndex = (() => {
    let idx = -1;
    for (let i = 0; i < currentPrices.length; i++) {
      if (currentPrices[i] != null) idx = i;
    }
    return idx;
  })();
  const recommendedPrices = currentPrices.map((_, i) => i <= lastValidIndex ? recommended : null);

  // Проверка валидности mean для рыночной цены
  const isValidMean =
    selected.mean !== undefined &&
    selected.mean !== null &&
    selected.min !== undefined &&
    selected.max !== undefined &&
    selected.mean >= selected.min * 0.5 &&
    selected.mean <= selected.max * 2;

  // minY: 10% ниже минимальной цены
  const minY = selected.min ? Math.max(0, Math.floor(selected.min * 0.9)) : 0;
  function shiftValue(val: number | null): number | null {
    if (val == null) return null;
    return (val - minY) * 0.9 + minY;
  }

  return {
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
        let html = `<div style='font-size:15px;font-weight:600;'>${params[0]?.axisValue || params.name}</div>`;
        (Array.isArray(params) ? params : [params]).forEach((p: any) => {
          if (p.seriesName === 'Текущая' && p.value != null) {
            html += `<div style='margin-top:4px; color:#3b82f6;'>Текущая: <b>${p.value.toLocaleString()}₽</b></div>`;
          }
          if (p.seriesName === 'Рекомендуемая' && p.value != null) {
            html += `<div style='margin-top:4px; color:#a855f7;'>Рекомендуемая: <b>${p.value.toLocaleString()}₽</b></div>`;
          }
          if (p.seriesName === 'Рыночная цена' && p.value != null) {
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
        data: currentPrices.map(shiftValue),
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#3b82f6' },
        symbol: 'circle',
        symbolSize: 8,
        z: 10,
        areaStyle: { color: 'rgba(59,130,246,0.10)' },
        connectNulls: false,
      },
      recommended && {
        name: 'Рекомендуемая',
        type: 'line',
        data: recommendedPrices.map(shiftValue),
        lineStyle: { color: '#a855f7', type: 'dashed', width: 2 },
        itemStyle: { color: '#a855f7' },
        symbol: 'none',
        z: 5,
        connectNulls: false,
      },
      isValidMean && {
        name: 'Рыночная цена',
        type: 'line',
        data: marketPrices.map(shiftValue),
        lineStyle: { color: '#f59e42', type: 'dotted', width: 2 },
        itemStyle: { color: '#f59e42' },
        symbol: 'none',
        z: 4,
        connectNulls: false,
      },
    ].filter(Boolean),
  };
} 