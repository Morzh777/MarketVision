import React from 'react';

interface PriceTrendGraphProps {
  className?: string;
  size?: number;
  trend?: 'up' | 'down' | 'stable';
}

const PriceTrendGraph: React.FC<PriceTrendGraphProps> = ({ 
  className = '', 
  size = 16, 
  trend = 'stable' 
}) => {
  const getPath = () => {
    switch (trend) {
      case 'up':
        return 'M2 14 L6 10 L10 12 L14 8 L18 6 L22 4 L26 2';
      case 'down':
        return 'M2 2 L6 6 L10 4 L14 8 L18 10 L22 12 L26 14';
      default:
        return 'M2 8 L6 10 L10 8 L14 10 L18 8 L22 10 L26 8';
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up':
        return 'trend-up';
      case 'down':
        return 'trend-down';
      default:
        return 'trend-stable';
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 16"
      fill="none"
      className={`${className} ${getTrendClass()}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={getPath()}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PriceTrendGraph; 