import { Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './services/userService';

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('verify')
  async verify(@Req() request: Request) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          message: 'Токен не найден',
        };
      }

      const token = authHeader.substring(7);

      if (!token) {
        return {
          success: false,
          message: 'Неверный токен',
        };
      }

      // Ищем пользователя по id (токену)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const user = (await this.userService.getUserById(
        token,
      )) as AdminUser | null;

      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден',
        };
      }

      // Проверяем, что пользователь - админ
      if (user.role !== 'admin') {
        return {
          success: false,
          message: 'Недостаточно прав',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return {
        success: false,
        message: 'Ошибка проверки токена',
      };
    }
  }

  @Post('logout')
  logout() {
    try {
      // В реальном проекте здесь должна быть логика инвалидации токена
      // Пока что просто возвращаем успех
      return {
        success: true,
        message: 'Выход выполнен успешно',
      };
    } catch (error) {
      console.error('Ошибка выхода:', error);
      return {
        success: false,
        message: 'Ошибка выхода',
      };
    }
  }
}
