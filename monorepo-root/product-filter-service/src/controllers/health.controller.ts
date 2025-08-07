import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  /**
   * Health check endpoint
   * GET /health
   */
  @Get('health')
  health(): { status: string; timestamp: string; service: string } {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'product-filter-service'
    };
  }
} 