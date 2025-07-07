import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

/**
 * E2E тест для проверки массовой вставки продуктов и истории цен через gRPC
 */
describe('Product gRPC e2e (external server)', () => {
  let client: any;

  const PROTO_PATH = path.join(__dirname, '../src/proto/raw-product.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const productProto = grpc.loadPackageDefinition(packageDefinition).raw_product as any;

  beforeAll(async () => {
    client = new productProto.RawProductService(
      'localhost:50051',
      grpc.credentials.createInsecure()
    );
  });

  afterAll(async () => {
    // gRPC клиент не требует явного disconnect
  });

  it('should insert products and price history correctly (gRPC only)', (done) => {
    const products = [
      {
        id: 'test-1',
        name: 'Test Product 1',
        price: 1000,
        image_url: 'http://img/1',
        product_url: 'http://prod/1',
        category: 'videocards',
        source: 'wb',
        query: '4080',
      },
      {
        id: 'test-2',
        name: 'Test Product 2',
        price: 1200,
        image_url: 'http://img/2',
        product_url: 'http://prod/2',
        category: 'videocards',
        source: 'wb',
        query: '4080',
      },
      {
        id: 'test-3',
        name: 'Test Product 3',
        price: 900,
        image_url: 'http://img/3',
        product_url: 'http://prod/3',
        category: 'videocards',
        source: 'wb',
        query: '4080',
      },
      // невалидный (цена 0)
      {
        id: 'test-4',
        name: 'Test Product 4',
        price: 0,
        image_url: 'http://img/4',
        product_url: 'http://prod/4',
        category: 'videocards',
        source: 'wb',
        query: '4080',
      },
    ];
    client.BatchCreateProducts({ products }, (err: any, response: any) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('gRPC error:', err);
      }
      // eslint-disable-next-line no-console
      console.log('gRPC response:', response);
      try {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(typeof response.inserted).toBe('number');
        expect(response.inserted).toBe(3); // только валидные
        expect(typeof response.history).toBe('number');
        expect(response.history).toBe(3); // история цен для валидных
        done();
      } catch (e: any) {
        done(e);
      }
    });
  }, 20000);
}); 