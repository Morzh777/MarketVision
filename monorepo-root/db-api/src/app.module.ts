import { Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { AuthController } from './auth.controller';
import { HealthController } from './health.controller';
import { UserService } from './services/userService';

@Module({
  imports: [ProductModule],
  controllers: [AuthController, HealthController],
  providers: [UserService],
})
export class AppModule {}
