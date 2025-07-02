import { Module } from '@nestjs/common';
import { ProductFilterClient, grpcClientOptions } from '../../../grpc-clients/product-filter.client';
import { ClientsModule } from '@nestjs/microservices';

export const PRODUCT_FILTER_SERVICE = 'PRODUCT_FILTER_SERVICE';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_FILTER_SERVICE,
        ...grpcClientOptions,
      },
    ]),
  ],
  providers: [
    {
      provide: ProductFilterClient,
      useFactory: (client: any) => {
        return new ProductFilterClient(client);
      },
      inject: [PRODUCT_FILTER_SERVICE],
    },
  ],
  exports: [ProductFilterClient],
})
export class FilterModule {} 