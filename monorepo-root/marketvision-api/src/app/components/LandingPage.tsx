"use client";

import React from 'react';

import '../styles/components/landing-page.scss';

const LandingPage = () => {
  return (
    <div className="landingPage">
      {/* Hero Section */}
      <section className="hero">
        <div className="heroContent">
          <h1 className="heroTitle">
            MarketVision
          </h1>
          <p className="heroSubtitle">
            Умный мониторинг цен на компьютерные комплектующие и электронику
          </p>
          <div className="heroFeatures">
            <div className="feature">
              <span className="featureIcon">🔍</span>
              <span>Отслеживание цен в реальном времени</span>
            </div>
            <div className="feature">
              <span className="featureIcon">📊</span>
              <span>Аналитика и прогнозирование</span>
            </div>
            <div className="feature">
              <span className="featureIcon">⚡</span>
              <span>Уведомления об изменениях</span>
            </div>
          </div>
          <button className="ctaButton">
            Начать мониторинг
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="sectionTitle">Возможности сервиса</h2>
        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">🖥️</div>
            <h3>Компьютерные комплектующие</h3>
            <p>Мониторинг цен на процессоры, видеокарты, материнские платы и другие компоненты</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">🎮</div>
            <h3>Игровые консоли</h3>
            <p>Отслеживание цен на PlayStation, Nintendo Switch, Steam Deck и другие консоли</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">📱</div>
            <h3>Мобильные устройства</h3>
            <p>Мониторинг цен на смартфоны, планшеты и аксессуары</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">📈</div>
            <h3>Аналитика рынка</h3>
            <p>Статистика цен, тренды и прогнозы для принятия решений</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">🔔</div>
            <h3>Уведомления</h3>
            <p>Получайте уведомления о значительных изменениях цен</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">📊</div>
            <h3>История цен</h3>
            <p>Просматривайте историю изменения цен за любой период</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="howItWorks">
        <h2 className="sectionTitle">Как это работает</h2>
        <div className="steps">
          <div className="step">
            <div className="stepNumber">1</div>
            <h3>Выберите товар</h3>
            <p>Найдите интересующий вас товар в каталоге или введите название</p>
          </div>
          <div className="step">
            <div className="stepNumber">2</div>
            <h3>Настройте мониторинг</h3>
            <p>Установите желаемую цену и настройте уведомления</p>
          </div>
          <div className="step">
            <div className="stepNumber">3</div>
            <h3>Получайте уведомления</h3>
            <p>Система автоматически отслеживает цены и уведомляет вас</p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="statistics">
        <h2 className="sectionTitle">Статистика сервиса</h2>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statNumber">10,000+</div>
            <div className="statLabel">Отслеживаемых товаров</div>
          </div>
          <div className="statCard">
            <div className="statNumber">24/7</div>
            <div className="statLabel">Мониторинг цен</div>
          </div>
          <div className="statCard">
            <div className="statNumber">5+</div>
            <div className="statLabel">Маркетплейсов</div>
          </div>
          <div className="statCard">
            <div className="statNumber">99.9%</div>
            <div className="statLabel">Время работы</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="ctaContent">
          <h2>Готовы начать мониторинг цен?</h2>
          <p>Присоединяйтесь к тысячам пользователей, которые уже экономят на покупках</p>
          <button className="ctaButton">
            Попробовать бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footerContent">
          <div className="footerSection">
            <h4>MarketVision</h4>
            <p>Умный мониторинг цен на электронику</p>
          </div>
          <div className="footerSection">
            <h4>Сервисы</h4>
            <ul>
              <li>Мониторинг цен</li>
              <li>Аналитика рынка</li>
              <li>Уведомления</li>
              <li>API для разработчиков</li>
            </ul>
          </div>
          <div className="footerSection">
            <h4>Поддержка</h4>
            <ul>
              <li>Документация</li>
              <li>FAQ</li>
              <li>Контакты</li>
              <li>Статус сервиса</li>
            </ul>
          </div>
        </div>
        <div className="footerBottom">
          <p>&copy; 2025 MarketVision. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 