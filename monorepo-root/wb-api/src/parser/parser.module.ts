import { Module } from '@nestjs/common';
import { VideocardsService } from './application/services/videocards.service';
import { CpusService } from './application/services/cpus.service';
import { MotherboardsService } from './application/services/motherboards.service';
import { FilterModule } from './domain/filter/filter.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

@Module({
  imports: [FilterModule, InfrastructureModule],
  controllers: [],
  providers: [VideocardsService, CpusService, MotherboardsService],
  exports: [VideocardsService, CpusService, MotherboardsService]
})
export class ParserModule {} 