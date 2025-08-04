import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { WbParserService } from '../parser/wb-parser.service';
import {
  GetRawProductsCall,
  GetRawProductsCallback,
  GetRawProductsRequest,
  GetRawProductsResponse,
  GrpcError,
} from '../types/grpc.types';

const PROTO_PATH = path.join(__dirname, '../../proto/raw-product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const rawProductProto = grpc.loadPackageDefinition(packageDefinition)
  .raw_product as any;

@Injectable()
export class GrpcServerService implements OnModuleInit {
  private readonly logger = new Logger(GrpcServerService.name);
  private server: grpc.Server;

  constructor(private readonly wbParserService: WbParserService) {
    this.server = new grpc.Server();
  }

  async onModuleInit(): Promise<void> {
    this.startGrpcServer();
  }

  private startGrpcServer(): void {
    this.server.addService(rawProductProto.RawProductService.service, {
      GetRawProducts: this.getRawProducts.bind(this),
    });

    const grpcPort = process.env.GRPC_PORT || 3000;
    this.server.bindAsync(
      `0.0.0.0:${grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (err: Error | null, port: number) => {
        if (err) {
          this.logger.error(`❌ Ошибка запуска gRPC сервера: ${err.message}`);
          return;
        }
        this.server.start();
        this.logger.log(`🚀 WB API gRPC сервер запущен на порту ${port}`);
      },
    );
  }

  private async getRawProducts(
    call: GetRawProductsCall,
    callback: GetRawProductsCallback,
  ): Promise<void> {
    try {
      const request: GetRawProductsRequest = call.request;
      const { query, category, categoryKey, auth_token } = request;

      // Проверка аутентификации
      const expectedToken = process.env.WB_API_TOKEN;
      if (!expectedToken) {
        const error: GrpcError = {
          code: grpc.status.INTERNAL,
          message: 'Server configuration error: WB_API_TOKEN not set',
          details: 'Сервер не настроен',
        };
        callback(error);
        return;
      }

      if (!auth_token || auth_token !== expectedToken) {
        const error: GrpcError = {
          code: grpc.status.UNAUTHENTICATED,
          message: 'Invalid or missing authentication token',
          details: 'Неверный или отсутствующий токен аутентификации',
        };
        callback(error);
        return;
      }

      // Валидация входных данных
      if (!query || !category) {
        const error: GrpcError = {
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Query и category обязательны',
          details: 'Отсутствуют обязательные параметры запроса',
        };
        callback(error);
        return;
      }

      this.logger.log(`🔍 WB API: ${query} (${category})`);

      const products = await this.wbParserService.parseProducts(
        query,
        category,
      );

      // Используем categoryKey для возврата в ответе (как в тесте)
      const responseCategory = categoryKey || category;

      const responseProducts = products.map((product) => ({
        ...product,
        category: responseCategory,
      }));

      const response: GetRawProductsResponse = {
        products: responseProducts,
        total_count: responseProducts.length,
        source: 'wb',
      };

      callback(null, response);
    } catch (error) {
      this.logger.error(
        `❌ Ошибка парсинга: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );

      const grpcError: GrpcError = {
        code: grpc.status.INTERNAL,
        message: `Ошибка парсинга: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      };

      callback(grpcError);
    }
  }
}
