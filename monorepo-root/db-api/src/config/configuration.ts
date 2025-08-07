export default () => ({
  port: parseInt(process.env.PORT ?? '3003', 10),
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/marketvision',
  },
  grpc: {
    url: process.env.GRPC_URL || '0.0.0.0:50051',
  },
});
