import { NextResponse } from "next/server";

const services = {
  "db-api": process.env.DB_API_URL || "http://localhost:3003",
  "product-filter-service": process.env.PRODUCT_FILTER_SERVICE_URL || "http://localhost:3001",
  "wb-api": process.env.WB_API_URL || "http://localhost:3006",
  "ozon-api": process.env.OZON_API_URL || "http://localhost:3005",
};

async function checkServiceHealth(name: string, url: string) {
  const startTime = Date.now();
  const lastCheck = new Date().toISOString();

  try {
    // Пробуем разные health endpoints для каждого сервиса
    const healthEndpoints = [];
    
    if (name === "db-api") {
      healthEndpoints.push(`${url}/api/health`); // Используем health endpoint (с префиксом /api)
    } else {
      healthEndpoints.push(`${url}/health`, `${url}/api/health`, url);
    }

    let response;
    for (const endpoint of healthEndpoints) {
      try {
        response = await fetch(endpoint, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) break; // Если получили 200 - выходим
      } catch {
        continue; // Пробуем следующий endpoint
      }
    }

    const responseTime = Date.now() - startTime;

    if (response && response.ok) {
      return {
        name,
        url,
        status: "online",
        responseTime,
        lastCheck
      };
    } else {
      return {
        name,
        url,
        status: "offline",
        responseTime,
        lastCheck,
        error: response ? `HTTP ${response.status}` : "No response"
      };
    }
  } catch {
    const responseTime = Date.now() - startTime;
    return {
      name,
      url,
      status: "offline",
      responseTime,
      lastCheck,
      error: "Service unavailable"
    };
  }
}

export async function GET() {
  try {
    console.log("🔍 Проверка статуса сервисов...");
    
    const statusPromises = Object.entries(services).map(([name, url]) =>
      checkServiceHealth(name, url)
    );

    const servicesStatus = await Promise.all(statusPromises);
    
    const totalServices = servicesStatus.length;
    const onlineServices = servicesStatus.filter(s => s.status === "online").length;
    const offlineServices = servicesStatus.filter(s => s.status === "offline").length;
    const errorServices = servicesStatus.filter(s => s.status === "error").length;

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
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("❌ Ошибка проверки статуса сервисов:", error);
    return NextResponse.json(
      { 
        error: "Failed to check services status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
