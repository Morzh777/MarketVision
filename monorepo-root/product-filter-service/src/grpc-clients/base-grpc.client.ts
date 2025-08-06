import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

export abstract class BaseGrpcClient<T> {
  protected client: T;

  constructor(
    protoRelativePath: string,
    serviceName: string,
    serverAddress: string
  ) {
    const PROTO_PATH = path.join(process.cwd(), protoRelativePath);
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto: any = grpc.loadPackageDefinition(packageDefinition);
    
    // Используем insecure подключение для внутренних сервисов в Docker сети
    const credentials = grpc.credentials.createInsecure();
    this.client = new proto.raw_product[serviceName](
      serverAddress,
      credentials
    );
    console.log(`🔗 gRPC клиент подключен к ${serverAddress} (SSL: false, internal)`);
  }
} 