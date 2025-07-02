import { Injectable, Logger } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { CpusService } from '../parser/application/services/cpus.service';
import { VideocardsService } from '../parser/application/services/videocards.service';
import { MotherboardsService } from '../parser/application/services/motherboards.service';

const PROTO_PATH = path.join(__dirname, '../../proto/raw-product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const rawProductProto = grpc.loadPackageDefinition(packageDefinition).raw_product as any;

@Injectable()
export class GrpcServerService implements OnModuleInit {
  private readonly logger = new Logger(GrpcServerService.name);
  private server: grpc.Server;

  constructor(
    private readonly cpusService: CpusService,
    private readonly videocardsService: VideocardsService,
    private readonly motherboardsService: MotherboardsService,
  ) {}

  onModuleInit() {
    this.startGrpcServer();
  }

  private startGrpcServer() {
    this.server = new grpc.Server();

    // Новый сервис и метод!
    this.server.addService(rawProductProto.RawProductService.service, {
      GetRawProducts: this.getRawProducts.bind(this),
    });

    const port = 3000;
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          this.logger.error(`❌ Ошибка запуска gRPC сервера: ${err.message}`);
          return;
        }
        this.server.start();
        this.logger.log(`🚀 WB API gRPC сервер (raw-product.proto) запущен на порту ${port}`);
      }
    );
  }

  private async getRawProducts(call: any, callback: any) {
    try {
      const { query, category, categoryKey } = call.request;
      this.logger.log(`🔍 gRPC GetRawProducts WB: ${query} (${category})`);

      let products: any[] = [];
      const xsubject: number = parseInt(category, 10) || 0;

      // Определяем сервис по xsubject
      if (xsubject === 3698) {
        products = await this.cpusService.searchProductsByQuery(query, xsubject);
      } else if (xsubject === 3274) {
        products = await this.videocardsService.searchProductsByQuery(query, xsubject);
      } else if (xsubject === 3690) {
        products = await this.motherboardsService.searchProductsByQuery(query, xsubject);
      } else {
        this.logger.warn(`⚠️ Неизвестный xsubject: ${xsubject}`);
        products = [];
      }

      this.logger.log(`📦 Получено ${products.length} сырых продуктов от WB API`);

      // Новый формат ответа!
      const categoryOut = categoryKey || category;
      const rawProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || '',
        product_url: product.product_url || '',
        category: categoryOut,
        source: 'wb',
        query: query  // Добавляем query к каждому товару
      }));

      this.logger.log(`✅ gRPC ответ: ${rawProducts.length} продуктов от WB API`);

      callback(null, {
        products: rawProducts,
        total_count: rawProducts.length,
        source: 'wb'
      });

    } catch (error) {
      this.logger.error(`❌ Ошибка gRPC запроса: ${error.message}`);
      callback({
        code: grpc.status.INTERNAL,
        message: `Ошибка парсинга: ${error.message}`
      });
    }
  }
} 