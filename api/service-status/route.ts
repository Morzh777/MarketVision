import { NextResponse } from 'next/server';

const services = {
  'db-api': process.env.DB_API_URL || 'http://localhost:3003',
  'product-filter-service': process.env.PRODUCT_FILTER_SERVICE_URL || 'http://localhost:3001',
  'wb-api': process.env.WB_API_URL || 'http://localhost:3006',
  'ozon-api': process.env.OZON_API_URL || 'http://localhost:3005',
};

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

async function checkServiceHealth(name: string, url: string): Promise<ServiceStatus> {
  const startTime = Date.now();
  const lastCheck = new Date().toISOString();

  try {
    // Пробуем разные эндпоинты для проверки
    const healthEndpoints = [
      `${url}/health`,
      `${url}/api/health`, 
      `${url}/status`,
      `${url}`
    ];

    let response;
    let error;

    for (const endpoint of healthEndpoints) {
      try {
        response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 секунд таймаут
        });
        
        if (response.ok) {
          break; // Успешный ответ, выходим
        }
      } catch (e) {
        error = e;
        continue; // Пробуем следующий эндпоинт
      }
    }

    const responseTime = Date.now() - startTime;

    if (response && response.ok) {
      return {
        name,
        url,
        status: 'online',
        responseTime,
        lastCheck
      };
    } else {
      const httpStatus = response?.status;
      // Любой не-200 HTTP код = сервис офлайн/недоступен
      return {
        name,
        url,
        status: 'offline',
        responseTime,
        lastCheck,
        error: httpStatus ? `HTTP ${httpStatus}` : 'No response'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Все ошибки подключения считаем как офлайн
    // (сервис недоступен, выключен, не отвечает)
    return {
      name,
      url,
      status: 'offline',
      responseTime,
      lastCheck,
      error: 'Service unavailable'
    };
  }
}

export async function GET() {
  try {
    console.log('🔍 Проверка статуса сервисов...');
    
    // Проверяем все сервисы параллельно
    const statusPromises = Object.entries(services).map(([name, url]) =>
      checkServiceHealth(name, url)
    );

    const servicesStatus = await Promise.all(statusPromises);
    
    // Статистика
    const totalServices = servicesStatus.length;
    const onlineServices = servicesStatus.filter(s => s.status === 'online').length;
    const offlineServices = servicesStatus.filter(s => s.status === 'offline').length;
    const errorServices = servicesStatus.filter(s => s.status === 'error').length;

    console.log(`✅ Онлайн: ${onlineServices}, ❌ Офлайн: ${offlineServices}, 🚨 Ошибки: ${errorServices}`);

    return NextResponse.json({
      summary: {
        total: totalServices,
        online: onlineServices,
        offline: offlineServices,
        error: errorServices,
        healthPercentage: Math.round((onlineServices / totalServices) * 100)
      },
      services: servicesStatus,
      lastUpdate: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Отключаем кэширование для мониторинга!
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('❌ Ошибка проверки статуса сервисов:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check services status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 