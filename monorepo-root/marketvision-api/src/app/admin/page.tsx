'use client';

import { useState, useEffect } from 'react';

import styles from './admin.module.scss';

interface SchedulerStatus {
  isRunning: boolean;
  isParsing: boolean;
  nextRun: string;
  config: Record<string, string[]>;
  activeCategories?: Record<string, boolean>;
}

export default function AdminPage() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/scheduler/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Ошибка получения статуса:', error);
      setMessage('Ошибка получения статуса планировщика');
    }
  };

  const runParsingNow = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/scheduler/run-now', {
        method: 'POST',
      });
      const data = await response.json();
      setMessage(`Парсинг запущен: ${data.message}`);
      await fetchStatus(); // Обновляем статус
    } catch (error) {
      console.error('Ошибка запуска парсинга:', error);
      setMessage('Ошибка запуска парсинга');
    } finally {
      setLoading(false);
    }
  };

  const startScheduler = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/scheduler/start', {
        method: 'POST',
      });
      const data = await response.json();
      setMessage(`Планировщик запущен: ${data.message}`);
      await fetchStatus();
    } catch (error) {
      console.error('Ошибка запуска планировщика:', error);
      setMessage('Ошибка запуска планировщика');
    } finally {
      setLoading(false);
    }
  };

  const stopScheduler = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/scheduler/stop', {
        method: 'POST',
      });
      const data = await response.json();
      setMessage(`Планировщик остановлен: ${data.message}`);
      await fetchStatus();
    } catch (error) {
      console.error('Ошибка остановки планировщика:', error);
      setMessage('Ошибка остановки планировщика');
    } finally {
      setLoading(false);
    }
  };

  const updateCategories = async (categories: Record<string, boolean>) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/scheduler/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeCategories: categories }),
      });
      const data = await response.json();
      setMessage(`Категории обновлены: ${data.message}`);
      await fetchStatus();
    } catch (error) {
      console.error('Ошибка обновления категорий:', error);
      setMessage('Ошибка обновления категорий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Обновляем статус каждые 30 секунд
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Админка MarketVision</h1>
      
      <div className={styles.section}>
        <h2>Планировщик парсинга</h2>
        
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span>Статус планировщика:</span>
            <span className={status.isRunning ? styles.running : styles.stopped}>
              {status.isRunning ? 'Запущен' : 'Остановлен'}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span>Статус парсинга:</span>
            <span className={status.isParsing ? styles.running : styles.stopped}>
              {status.isParsing ? 'Выполняется' : 'Ожидает'}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span>Следующий запуск:</span>
            <span>{new Date(status.nextRun).toLocaleString('ru-RU')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={runParsingNow}
            disabled={loading}
            className={styles.runButton}
          >
            {loading ? 'Запуск...' : 'Запустить парсинг сейчас'}
          </button>
          
          <button 
            onClick={startScheduler}
            disabled={loading || status.isRunning}
            className={styles.startButton}
          >
            Запустить планировщик
          </button>
          
          <button 
            onClick={stopScheduler}
            disabled={loading || !status.isRunning}
            className={styles.stopButton}
          >
            Остановить планировщик
          </button>
          
          <button 
            onClick={fetchStatus}
            className={styles.refreshButton}
          >
            Обновить статус
          </button>
        </div>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Управление категориями</h2>
        <div className={styles.configGrid}>
          {Object.entries(status.config).map(([category, queries]) => {
            const isActive = status.activeCategories?.[category] || false;
            return (
              <div key={category} className={`${styles.configCard} ${isActive ? styles.activeCard : styles.inactiveCard}`}>
                <h3>{category}</h3>
                <p>Запросы: {queries.join(', ')}</p>
                <div className={styles.categoryToggle}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        const newCategories = {
                          ...status.activeCategories,
                          [category]: e.target.checked
                        };
                        updateCategories(newCategories);
                      }}
                      disabled={loading}
                    />
                    {isActive ? 'Активна' : 'Неактивна'}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 