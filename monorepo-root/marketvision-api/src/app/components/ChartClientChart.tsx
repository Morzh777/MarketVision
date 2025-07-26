"use client";
import ReactECharts from 'echarts-for-react';
import React from 'react';

import styles from '../styles/components/chart-block.module.scss';

interface ChartClientChartProps {
  option: Record<string, unknown>;
}

const ChartClientChart: React.FC<ChartClientChartProps> = ({ option }) => {
  return (
    <ReactECharts
      option={option}
      className={styles.chart}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={true}
      style={{ height: '400px' }}
      onEvents={{
        finished: () => {
          // Успешная инициализация
        }
      }}
    />
  );
};

export default ChartClientChart; 