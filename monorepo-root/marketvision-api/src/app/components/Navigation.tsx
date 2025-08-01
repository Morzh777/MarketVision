"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/components/navigation.module.scss';

const Navigation = () => {
  const pathname = usePathname();
  const isLanding = pathname === '/landing';
  const isApp = pathname === '/';

  return (
    <nav className={styles.navigation}>
      <div className={styles.navContent}>
        <Link href="/landing" className={styles.logo}>
          MarketVision
        </Link>
        
        <div className={styles.navLinks}>
          <Link 
            href="/landing" 
            className={`${styles.navLink} ${isLanding ? styles.active : ''}`}
          >
            Главная
          </Link>
          <Link 
            href="/" 
            className={`${styles.navLink} ${isApp ? styles.active : ''}`}
          >
            Приложение
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 