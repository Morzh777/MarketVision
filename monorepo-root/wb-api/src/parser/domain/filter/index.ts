// Экспорт интерфейсов
export * from './interfaces/filter.interfaces';

// Экспорт сущностей
export * from './entities/filter-config.entity';

// Экспорт gRPC клиента (с переименованием для избежания конфликтов)
// export { 
//   ProductFilterClient,
//   RawProduct,
//   ProcessedProduct,
//   FilterConfig as GrpcFilterConfig
// } from '../../../grpc-clients/product-filter.client';

// Экспорт модуля
export * from './filter.module'; 