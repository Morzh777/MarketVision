import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { MockHourlyCheapestItem, Timeframe } from '../types/market';

interface ChartBlockProps {
  selected: MockHourlyCheapestItem;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  chartOption: any;
}

const timeframes = [
  { key: 'day' as Timeframe, label: 'День' },
  { key: 'week' as Timeframe, label: 'Неделя' },
  { key: 'month' as Timeframe, label: 'Месяц' },
  { key: 'year' as Timeframe, label: 'Год' },
];

const ChartBlock: React.FC<ChartBlockProps> = ({ selected, timeframe, setTimeframe, chartOption }) => (
  <div className="bg-white dark:bg-[#23272F] rounded shadow p-4 sm:p-8 w-full flex flex-col items-center justify-start transition-colors duration-300" style={{ minHeight: 320 }}>
    <div className="flex gap-2 mb-4 w-full justify-center flex-wrap">
      {timeframes.map((tf) => (
        <button
          key={tf.key}
          onClick={() => setTimeframe(tf.key)}
          className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded font-medium text-sm transition-colors border border-transparent ${timeframe === tf.key ? 'bg-blue-600 text-white' : 'bg-[#23272F] text-gray-200 hover:bg-[#3a3f4a]'}`}
        >
          {tf.label}
        </button>
      ))}
    </div>
    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 w-full text-left">
      График цены{selected.qwerty && (
        <span className="ml-2 text-[#3b82f6] font-semibold">{selected.qwerty}</span>
      )}
    </h2>
    <ReactECharts
      option={chartOption}
      style={{ height: 'min(60vw,400px)', width: '100%', minHeight: 220, maxHeight: 400 }}
      opts={{ renderer: 'canvas' }}
    />
  </div>
);

export default ChartBlock; 