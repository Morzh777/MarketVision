import { Module } from '@nestjs/common';
import { ProductValidatorBase } from './product-validator.base';
import { MotherboardsValidator } from './category/motherboards.validator';
import { ProcessorsValidator } from './category/processors.validator';
import { VideocardsValidator } from './category/videocards.validator';
import { PlaystationValidator } from './category/playstation.validator';
import { NintendoSwitchValidator } from './category/nintendo-switch.validator';
import { SteamDeckValidator } from './category/steam-deck.validator';
import { IphoneValidator } from './category/iphone.validator';
import { ValidationFactoryService } from './validation-factory.service';

@Module({
  providers: [
    ProductValidatorBase,
    MotherboardsValidator,
    ProcessorsValidator,
    VideocardsValidator,
    PlaystationValidator,
    NintendoSwitchValidator,
    SteamDeckValidator,
    IphoneValidator,
    ValidationFactoryService,
  ],
  exports: [
    ProductValidatorBase,
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