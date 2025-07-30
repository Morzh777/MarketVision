import { Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { AuthController } from './auth.controller';
import { UserService } from './services/userService';

@Module({
  imports: [ProductModule],
  controllers: [AuthController],
  providers: [UserService],
})
export class AppModule {}
