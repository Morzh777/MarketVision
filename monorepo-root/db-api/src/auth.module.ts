import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';
import { PrismaService } from './services/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, PrismaService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
