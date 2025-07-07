import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

const PROTO_PATH = path.join(process.cwd(), 'proto/raw-product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).raw_product as any;

export class DbApiClient {
  private client: any;

  constructor(serverAddress: string = 'localhost:50051') {
    const isProduction = process.env.NODE_ENV === 'production';
    const useSSL = process.env.GRPC_USE_SSL === 'true' || isProduction;
    const credentials = useSSL
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();
    this.client = new productProto.RawProductService(
      serverAddress,
      credentials
    );
    console.log(`🔗 DB API gRPC клиент подключен к ${serverAddress} (SSL: ${useSSL})`);
  }

  async batchCreateProducts(products: any[]): Promise<{ inserted: number }> {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      this.client.BatchCreateProducts({ products }, { deadline }, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

export default DbApiClient; 