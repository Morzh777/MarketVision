import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const grpcUrl = process.env.GRPC_URL ?? '0.0.0.0:50051';
  const protoPath = join(process.cwd(), 'src/proto/raw-product.proto');
  console.log('--- DB-API gRPC SERVICE START ---');
  console.log('Proto path:', protoPath);
  console.log('gRPC URL:', grpcUrl);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'raw_product',
        protoPath,
        url: grpcUrl,
      },
    },
  );
  await app.listen();
  console.log('DB-API gRPC microservice started and listening on', grpcUrl);
}
bootstrap();
