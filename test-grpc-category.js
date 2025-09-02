const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Загружаем proto файл
const packageDefinition = protoLoader.loadSync('monorepo-root/db-api/src/proto/raw-product.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const rawProductProto = grpc.loadPackageDefinition(packageDefinition).raw_product;

// Создаем клиент
const client = new rawProductProto.RawProductService('localhost:50051', grpc.credentials.createInsecure());

// Тестируем getCategoryConfig
const request = { categoryKey: 'videocards' };

console.log('Отправляем gRPC запрос:', request);

client.GetCategoryConfig(request, (error, response) => {
  if (error) {
    console.error('gRPC ошибка:', error);
  } else {
    console.log('gRPC ответ:', JSON.stringify(response, null, 2));
  }
});
