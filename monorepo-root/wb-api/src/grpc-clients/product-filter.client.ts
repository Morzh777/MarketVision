import { Injectable } from '@nestjs/common';
import { ClientGrpc, Client, Transport, GrpcOptions } from '@nestjs/microservices';
import { join } from 'path';

export interface RawProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
}

export interface GetRawProductsRequest {
  query: string;
  category: string;
}

export interface GetRawProductsResponse {
  products: RawProduct[];
  total_count: number;
  source: string;
}

export interface RawProductService {
  getRawProducts(request: GetRawProductsRequest): Promise<GetRawProductsResponse>;
}

@Injectable()
export class ProductFilterClient {
  private rawProductService: RawProductService;

  constructor(private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.rawProductService = this.client.getService<RawProductService>('RawProductService');
  }

  async getRawProducts(request: GetRawProductsRequest): Promise<GetRawProductsResponse> {
    return this.rawProductService.getRawProducts(request);
  }
}

export const grpcClientOptions: GrpcOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'raw_product',
    protoPath: join(__dirname, '../../proto/raw-product.proto'),
  },
}; 