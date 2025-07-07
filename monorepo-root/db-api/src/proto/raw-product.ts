import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { RawProductServiceClient as _raw_product_RawProductServiceClient, RawProductServiceDefinition as _raw_product_RawProductServiceDefinition } from './raw_product/RawProductService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  raw_product: {
    BatchCreateProductsRequest: MessageTypeDefinition
    BatchCreateProductsResponse: MessageTypeDefinition
    RawProduct: MessageTypeDefinition
    RawProductService: SubtypeConstructor<typeof grpc.Client, _raw_product_RawProductServiceClient> & { service: _raw_product_RawProductServiceDefinition }
  }
}

