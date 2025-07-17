import { Module } from '@nestjs/common';
import { WbParserService } from '../../parser/wb-parser.service';
import { WildberriesApiClientImpl } from '../../wb-api.client';

@Module({
  providers: [
    WbParserService,
    {
      provide: 'WB_API_CLIENT',
      useClass: WildberriesApiClientImpl,
    },
  ],
  exports: [WbParserService],
})
export class ParserModule {}
