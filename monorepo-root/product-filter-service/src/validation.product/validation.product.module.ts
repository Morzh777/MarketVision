import { Module } from '@nestjs/common';
import { UnifiedHybridValidator } from './unified-hybrid.validator';
import { OpenAiValidationService } from '../services/openai.service';

@Module({
  providers: [UnifiedHybridValidator, OpenAiValidationService],
  exports: [UnifiedHybridValidator, OpenAiValidationService],
})
export class ValidationProductModule {}
