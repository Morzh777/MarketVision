"use client";

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

type Point = { price: number | null; created_at: string };

interface PriceHistoryChartProps {
  data: Point[];
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
  const option = useMemo(() => {
    const sorted = [...data]
      .filter(p => p && p.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const seriesData = sorted
      .filter(p => typeof p.price === 'number')
      .map(p => [new Date(p.created_at).getTime(), Math.round(p.price as number)]);

    return {
      animation: false,
      grid: { left: 40, right: 12, top: 10, bottom: 25 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: number) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽'
      },
      xAxis: {
        type: 'time',
        axisLabel: { color: '#9CA3AF' },
        axisLine: { lineStyle: { color: '#374151' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#9CA3AF', formatter: (v: number) => new Intl.NumberFormat('ru-RU').format(v) },
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
  }, [data]);

  return <ReactECharts option={option} style={{ height: 180, width: '100%' }} notMerge lazyUpdate />;
};

export default PriceHistoryChart;

