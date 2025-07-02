import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private counters = new Map<string, { count: number, last: number }>();
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  check(key: string) {
    const now = Date.now();
    const entry = this.counters.get(key) || { count: 0, last: 0 };
    if (now - entry.last < 60000) {
      entry.count++;
      if (entry.count > this.MAX_REQUESTS_PER_MINUTE) {
        throw new HttpException(
          'Слишком много запросов. Попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    } else {
      entry.count = 1;
      entry.last = now;
    }
    this.counters.set(key, entry);
  }
} 