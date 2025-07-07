import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { RawProduct } from './raw-product.interface';

// gRPC Request/Response типы
export interface GetRawProductsRequest {
  query: string;
  category: string;
  categoryKey?: string;
}

export interface GetRawProductsResponse {
  products: RawProduct[];
  total_count: number;
  source: string;
}

// gRPC Error Response
export interface GrpcError {
  code: status;
  message: string;
  details?: string;
}

// Типизированные gRPC методы
export type UnaryCall<TRequest> = ServerUnaryCall<TRequest, any>;
export type UnaryCallback<TResponse> = sendUnaryData<TResponse>;

export type GetRawProductsCall = UnaryCall<GetRawProductsRequest>;
export type GetRawProductsCallback = UnaryCallback<GetRawProductsResponse>; 