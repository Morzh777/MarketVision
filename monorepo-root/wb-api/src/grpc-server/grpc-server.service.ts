import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { WbParserService } from '../parser/wb-parser.service';

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
    private readonly wbParserService: WbParserService,
  ) {}

  async onModuleInit() {
    await this.startGrpcServer();
  }

  private async startGrpcServer() {
    this.server = new grpc.Server();

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
        this.logger.log(`🚀 WB API gRPC сервер запущен на порту ${port}`);
      }
    );
  }

  private async getRawProducts(call: any, callback: any) {
    try {
      const { query, category, categoryKey } = call.request;
      this.logger.log(`🔍 WB API: ${query} (${category})`);

      const products = await this.wbParserService.parseProducts(query, category);
      
      // Используем categoryKey для возврата в ответе (как в тесте)
      const responseCategory = categoryKey || category;
      
      const responseProducts = products.map(product => ({
        ...product,
        category: responseCategory
      }));
      
      callback(null, {
        products: responseProducts,
        total_count: responseProducts.length,
        source: 'wb'
      });

    } catch (error) {
      this.logger.error(`❌ Ошибка: ${error.message}`);
      callback({
        code: grpc.status.INTERNAL,
        message: `Ошибка парсинга: ${error.message}`
      });
    }
  }
} 