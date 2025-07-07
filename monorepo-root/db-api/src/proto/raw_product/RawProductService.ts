// Original file: src/proto/raw-product.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { BatchCreateProductsRequest as _raw_product_BatchCreateProductsRequest, BatchCreateProductsRequest__Output as _raw_product_BatchCreateProductsRequest__Output } from '../raw_product/BatchCreateProductsRequest';
import type { BatchCreateProductsResponse as _raw_product_BatchCreateProductsResponse, BatchCreateProductsResponse__Output as _raw_product_BatchCreateProductsResponse__Output } from '../raw_product/BatchCreateProductsResponse';

export interface RawProductServiceClient extends grpc.Client {
  BatchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  BatchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  BatchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  BatchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  batchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  batchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  batchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  batchCreateProducts(argument: _raw_product_BatchCreateProductsRequest, callback: grpc.requestCallback<_raw_product_BatchCreateProductsResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface RawProductServiceHandlers extends grpc.UntypedServiceImplementation {
  BatchCreateProducts: grpc.handleUnaryCall<_raw_product_BatchCreateProductsRequest__Output, _raw_product_BatchCreateProductsResponse>;
  
}

export interface RawProductServiceDefinition extends grpc.ServiceDefinition {
  BatchCreateProducts: MethodDefinition<_raw_product_BatchCreateProductsRequest, _raw_product_BatchCreateProductsResponse, _raw_product_BatchCreateProductsRequest__Output, _raw_product_BatchCreateProductsResponse__Output>
}
