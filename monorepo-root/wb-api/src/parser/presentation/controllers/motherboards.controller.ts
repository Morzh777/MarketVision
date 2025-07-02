import { Controller, Get, Req, Logger } from '@nestjs/common';
import { MotherboardsService } from '../../application/services/motherboards.service';
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

@Controller('parser/motherboards')
export class MotherboardsController extends BaseRateLimitedController {
    private readonly logger = new Logger(MotherboardsController.name);

    constructor(
        private readonly motherboardsService: MotherboardsService,
        protected readonly rateLimitService: RateLimitService
    ) { super(rateLimitService); }

    @Get()
    async findAllMotherboards(@Req() req: Request): Promise<GrpcFilterResult[]> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        this.logger.log(`🌐 HTTP запрос на материнские платы от ${clientIp}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.motherboardsService.findAllMotherboards());
    }

    @Get('legacy')
    async findAllMotherboardsLegacy(@Req() req: Request): Promise<{ results: SearchResult[], stats: Stats }> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        this.logger.log(`🌐 HTTP запрос на материнские платы (legacy) от ${clientIp}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.motherboardsService.findAllProducts());
    }
} 