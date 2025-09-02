import { Module, Global } from '@nestjs/common';
import { DbApiHttpClient } from '../../http-clients/db-api.client';
import { ProductValidatorBase } from './product-validator.base';
import { MotherboardsValidator } from './category/motherboards.validator';
import { ProcessorsValidator } from './category/processors.validator';
import { VideocardsValidator } from './category/videocards.validator';
import { PlaystationValidator } from './category/playstation.validator';
import { NintendoSwitchValidator } from './category/nintendo-switch.validator';
import { SteamDeckValidator } from './category/steam-deck.validator';
import { IphoneValidator } from './category/iphone.validator';
import { ValidationFactoryService } from './validation-factory.service';

@Global()
@Module({
  providers: [
    MotherboardsValidator,
    ProcessorsValidator,
    VideocardsValidator,
    PlaystationValidator,
    NintendoSwitchValidator,
    SteamDeckValidator,
    IphoneValidator,
    DbApiHttpClient,
    ValidationFactoryService,
  ],
  exports: [
    MotherboardsValidator,
    ProcessorsValidator,
    VideocardsValidator,
    PlaystationValidator,
    NintendoSwitchValidator,
    SteamDeckValidator,
    IphoneValidator,
    ValidationFactoryService,
  ],
})
export class ValidationServiceModule {} 