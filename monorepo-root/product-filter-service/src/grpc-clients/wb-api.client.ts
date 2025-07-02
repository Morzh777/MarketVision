import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

const PROTO_PATH = path.join(__dirname, '../../proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product_filter as any;

export class WbApiClient {
  private client: any;

  constructor(serverAddress: string = 'localhost:3000') {
    const isProduction = process.env.NODE_ENV === 'production';
    const useSSL = process.env.GRPC_USE_SSL === 'true' || isProduction;
    const credentials = useSSL
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();
    this.client = new productProto.ProductFilterService(
      serverAddress,
      credentials
    );
    console.log(`🔗 WB API gRPC клиент подключен к ${serverAddress} (SSL: ${useSSL})`);
  }

  async filterProducts(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      this.client.FilterProducts(request, { deadline }, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

export default WbApiClient; 