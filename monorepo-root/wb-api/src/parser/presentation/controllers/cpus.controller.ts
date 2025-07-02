import { Controller, Get, Req, Query, Logger } from '@nestjs/common';
import { CpusService } from '../../application/services/cpus.service';
import { SearchResult, Stats } from '../../domain/interfaces/parser.interfaces';
import { BaseRateLimitedController } from '../rate-limit/base-rate-limited.controller';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { Request } from 'express';

interface GrpcFilterResult {
  query: string;
  products: any[];
  stats: {
    totalInput: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
}

@Controller('parser')
export class CpusController extends BaseRateLimitedController {
    private readonly logger = new Logger(CpusController.name);

    constructor(
        private readonly cpusService: CpusService,
        protected readonly rateLimitService: RateLimitService
    ) { super(rateLimitService); }

    @Get('processors')
    async getProcessors() {
        this.logger.log('📡 HTTP запрос на процессоры');
        return this.cpusService.findAllProcessors();
    }

    @Get()
    async findAllCPUs(@Req() req: Request, @Query('test') test?: string): Promise<GrpcFilterResult[]> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        const testMode = test === 'true';
        this.logger.log(`🌐 HTTP запрос на процессоры от ${clientIp}${testMode ? ' (TEST MODE)' : ''}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.cpusService.findAllProcessors(testMode));
    }

    @Get('legacy')
    async findAllCPUsLegacy(@Req() req: Request): Promise<{ results: SearchResult[], stats: Stats }> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        this.logger.log(`🌐 HTTP запрос на процессоры (legacy) от ${clientIp}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.cpusService.findAllProducts());
    }
} 