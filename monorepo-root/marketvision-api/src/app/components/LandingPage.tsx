"use client";

import React from 'react';

import Navigation from './Navigation';
import styles from '../styles/components/landing-page.module.scss';

const LandingPage = () => {
  return (
    <div className={styles.landingPage}>
      <Navigation />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            MarketVision
          </h1>
          <p className={styles.heroSubtitle}>
            Умный мониторинг цен на компьютерные комплектующие и электронику
          </p>
          <div className={styles.heroFeatures}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔍</span>
              <span>Отслеживание цен в реальном времени</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span>Аналитика и прогнозирование</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⚡</span>
              <span>Уведомления об изменениях</span>
            </div>
          </div>
          <button className={styles.ctaButton}>
            Начать мониторинг
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Возможности сервиса</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🖥️</div>
            <h3>Компьютерные комплектующие</h3>
            <p>Мониторинг цен на процессоры, видеокарты, материнские платы и другие компоненты</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎮</div>
            <h3>Игровые консоли</h3>
            <p>Отслеживание цен на PlayStation, Nintendo Switch, Steam Deck и другие консоли</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>Мобильные устройства</h3>
            <p>Мониторинг цен на смартфоны, планшеты и аксессуары</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3>Аналитика рынка</h3>
            <p>Статистика цен, тренды и прогнозы для принятия решений</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔔</div>
            <h3>Уведомления</h3>
            <p>Получайте уведомления о значительных изменениях цен</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3>История цен</h3>
            <p>Просматривайте историю изменения цен за любой период</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>Как это работает</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>Выберите товар</h3>
            <p>Найдите интересующий вас товар в каталоге или введите название</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>Настройте мониторинг</h3>
            <p>Установите желаемую цену и настройте уведомления</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>Получайте уведомления</h3>
            <p>Система автоматически отслеживает цены и уведомляет вас</p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className={styles.statistics}>
        <h2 className={styles.sectionTitle}>Статистика сервиса</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>10,000+</div>
            <div className={styles.statLabel}>Отслеживаемых товаров</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Мониторинг цен</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>5+</div>
            <div className={styles.statLabel}>Маркетплейсов</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>99.9%</div>
            <div className={styles.statLabel}>Время работы</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Готовы начать мониторинг цен?</h2>
          <p>Присоединяйтесь к тысячам пользователей, которые уже экономят на покупках</p>
          <button className={styles.ctaButton}>
            Попробовать бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>MarketVision</h4>
            <p>Умный мониторинг цен на электронику</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Сервисы</h4>
            <ul>
              <li>Мониторинг цен</li>
              <li>Аналитика рынка</li>
              <li>Уведомления</li>
              <li>API для разработчиков</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>Поддержка</h4>
            <ul>
              <li>Документация</li>
              <li>FAQ</li>
              <li>Контакты</li>
              <li>Статус сервиса</li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 MarketVision. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 