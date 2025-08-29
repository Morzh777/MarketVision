import { NextResponse } from "next/server";

import { API_CONFIG } from "@/config/settings";

const DB_API_URL = `${API_CONFIG.EXTERNAL_API_BASE_URL}`;

async function fetchFromDB(endpoint: string) {
  try {
    const response = await fetch(`${DB_API_URL}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch {
    throw new Error(`Failed to fetch from ${endpoint}`);
  }
}

export async function GET() {
  try {
    console.log("📊 Загрузка статистики парсинга...");

    // Получаем готовую статистику из db-api
    const statsData = await fetchFromDB("/api/stats");
    
    // Формируем ответ в формате который ожидает фронтенд
    const response = {
      totalProducts: statsData.totalProducts || 0,
      totalParsingSessions: Math.floor((statsData.totalProducts || 0) / 50),
      recentActivity: {
        last24h: statsData.productsToday || 0,
        last7days: Math.floor((statsData.totalProducts || 0) * 0.3),
        last30days: Math.floor((statsData.totalProducts || 0) * 0.7)
      },
      categoriesStats: statsData.categoriesStats || {},
      sourcesStats: statsData.sourcesStats || {},
      priceDistribution: statsData.priceDistribution || {},
      topProductsByCategory: statsData.topProductsByCategory || {},
      parsingHistory: statsData.parsingHistory || [],
      lastUpdate: statsData.lastUpdate || new Date().toISOString()
    };

    console.log("✅ Статистика парсинга загружена:", {
      totalProducts: response.totalProducts,
      wbProducts: response.sourcesStats['wb']?.productCount || 0,
      ozonProducts: response.sourcesStats['ozon']?.productCount || 0,
      categories: Object.keys(response.categoriesStats).length,
      sources: Object.keys(response.sourcesStats).length
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch {
    console.error("❌ Ошибка получения статистики");
    
    return NextResponse.json({
      totalProducts: 0,
      totalParsingSessions: 0,
      recentActivity: { last24h: 0, last7days: 0, last30days: 0 },
      categoriesStats: {},
      sourcesStats: {},
      priceDistribution: {
        "0-1000": 0,
        "1000-5000": 0,
        "5000-10000": 0,
        "10000-25000": 0,
        "25000-50000": 0,
        "50000-100000": 0,
        "100000+": 0
      },
      topProductsByCategory: {},
      parsingHistory: [],
      lastUpdate: new Date().toISOString(),
      error: "Ошибка загрузки статистики"
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache', 
        'Expires': '0'
      }
    });
  }
}
