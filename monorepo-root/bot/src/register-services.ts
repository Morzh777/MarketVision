import { VideocardsService } from './services/videocards.service';
import { WbApiClient } from './api/wb-api.client';
import { ProcessorsService } from './services/processors.service';
import { MotherboardsService } from './services/motherboards.service';
import { PostQueueService } from './services/post-queue.service';
import { SchedulerService } from './services/scheduler.service';

export function createServices() {
  const productFilterUrl = process.env.PRODUCT_FILTER_URL || 'http://localhost:3001';
  console.log(`🌐 Подключение к Product-Filter-Service: ${productFilterUrl}`);
  
  const wbApi = new WbApiClient(productFilterUrl);
  const postQueue = new PostQueueService();
  
  return {
    videocards: new VideocardsService(wbApi),
    processors: new ProcessorsService(wbApi),
    motherboards: new MotherboardsService(wbApi),
    postQueue,
  };
}

export function createScheduler(bot: any, chatId: string, services: any) {
  console.log(`📅 Создание планировщика для чата: ${chatId}`);
  
  return new SchedulerService(
    services.postQueue,
    services.videocards,
    services.processors,
    services.motherboards,
    bot,
    chatId
  );
} 