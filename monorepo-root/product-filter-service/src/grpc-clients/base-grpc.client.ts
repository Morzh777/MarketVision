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
    const isProduction = process.env.NODE_ENV === 'production';
    const useSSL = process.env.GRPC_USE_SSL === 'true' || isProduction;
    const credentials = useSSL
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();
    this.client = new proto.raw_product[serviceName](
      serverAddress,
      credentials
    );
    console.log(`🔗 gRPC клиент подключен к ${serverAddress} (SSL: ${useSSL})`);
  }
} 