import { Controller, Get, Req, Logger } from '@nestjs/common';
import { VideocardsService } from '../../application/services/videocards.service';
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

@Controller('parser/videocards')
export class VideocardsController extends BaseRateLimitedController {
    private readonly logger = new Logger(VideocardsController.name);

    constructor(
        private readonly videocardsService: VideocardsService,
        protected readonly rateLimitService: RateLimitService
    ) { super(rateLimitService); }

    @Get()
    async findAllVideocards(@Req() req: Request): Promise<GrpcFilterResult[]> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        this.logger.log(`🌐 HTTP запрос на видеокарты от ${clientIp}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.videocardsService.findAllVideocards());
    }

    @Get('legacy')
    async findAllVideocardsLegacy(@Req() req: Request): Promise<{ results: SearchResult[], stats: Stats }> {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        this.logger.log(`🌐 HTTP запрос на видеокарты (legacy) от ${clientIp}`);
        
        return this.rateLimited(req.ip || 'unknown', () => this.videocardsService.findAllProducts());
    }
} 