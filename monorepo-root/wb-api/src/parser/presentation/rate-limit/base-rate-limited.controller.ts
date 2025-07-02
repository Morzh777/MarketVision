import { RateLimitService } from './rate-limit.service';

export abstract class BaseRateLimitedController {
    constructor(protected readonly rateLimitService: RateLimitService) {}

    protected async rateLimited<T>(key: string, fn: () => Promise<T>): Promise<T> {
        this.rateLimitService.check(key);
        return fn();
    }
} 