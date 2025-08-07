import React from 'react';
import '../styles/components/advanced-analytics.scss';

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="advancedAnalytics__lockIcon">
    <path d="M12 7H11V5C11 2.24 8.76 0 6 0C3.24 0 1 2.24 1 5V7H0V16H12V7ZM3 5C3 3.34 4.34 2 6 2C7.66 2 9 3.34 9 5V7H3V5Z" fill="currentColor"/>
  </svg>
);

const AdvancedAnalytics: React.FC = () => {
  return (
    <div className="advancedAnalytics">
      <div className="advancedAnalytics__header">
        <h3 className="advancedAnalytics__title">Расширенная аналитика</h3>
        <LockIcon />
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 