import React from 'react';
import '../styles/components/advanced-analytics.scss';
import { LockIcon } from './Icons';

const AdvancedAnalytics: React.FC = () => {
  return (
    <div className="advancedAnalytics">
      <div className="advancedAnalytics__header">
        <h3 className="advancedAnalytics__title">Расширенная аналитика</h3>
        <LockIcon className="advancedAnalytics__lockIcon" />
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 