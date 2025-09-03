import { Controller, Post, Body, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './services/userService';
import { TelegramInitDto } from './dto/telegram.dto';

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

@Controller('auth')
export class AuthController {
  constructor(private userService: UserService) {}

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

      // Проверяем, что токен не пустой
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
      )) as AuthUser | null;
      if (!user) {
        return {
          success: false,
          message: 'Неверный токен',
        };
      }

      return {
        success: true,
        message: 'Токен валиден',
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

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    console.log('🔍 Логин запрос:', {
      username: body.username,
      password: body.password ? '***' : 'empty',
    });

    const user = await this.userService.validateUser(
      body.username,
      body.password,
    );

    console.log('🔍 Результат validateUser:', user);

    if (!user) {
      console.log('❌ Пользователь не найден или неверный пароль');
      return { success: false, message: 'Неверный логин или пароль' };
    }

    // Используем id как токен
    const token = user.id;

    console.log('✅ Логин успешен, токен:', token);

    return {
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      token: token,
    };
  }

  @Post('init')
  async init() {
    await this.userService.createAdmin();
    return { success: true, message: 'Админ создан' };
  }

  @Post('telegram')
  async saveTelegramUser(@Body() telegramUser: TelegramInitDto) {
    try {
      const user = await this.userService.saveTelegramUser(telegramUser);
      return {
        success: true,
        message: 'Telegram пользователь сохранен',
        user,
      };
    } catch (error) {
      console.error('Ошибка сохранения telegram пользователя:', error);
      return {
        success: false,
        message: 'Ошибка сохранения пользователя',
      };
    }
  }

  @Get('telegram')
  async checkTelegramAuth(@Req() request: Request) {
    try {
      // Получаем telegram_id из cookie
      const cookies = request.headers.cookie;
      if (!cookies) {
        return {
          success: false,
          message: 'Cookie не найдены',
        };
      }

      // Парсим cookie для получения telegram_id
      const cookiePairs = cookies
        .split(';')
        .map((pair) => pair.trim().split('='));
      const telegramIdCookie = cookiePairs.find(
        ([key]) => key === 'telegram_id',
      );

      if (!telegramIdCookie || !telegramIdCookie[1]) {
        return {
          success: false,
          message: 'telegram_id не найден в cookie',
        };
      }

      const telegramId = telegramIdCookie[1];

      // Проверяем, существует ли пользователь
      const user = await this.userService.getTelegramUser(telegramId);
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден',
        };
      }

      return {
        success: true,
        message: 'Пользователь авторизован',
        user,
      };
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      return {
        success: false,
        message: 'Ошибка проверки авторизации',
      };
    }
  }

  @Get('telegram/:telegram_id')
  async getTelegramUser(@Param('telegram_id') telegramId: string) {
    try {
      const user = await this.userService.getTelegramUser(telegramId);
      if (!user) {
        return {
          success: false,
          message: 'Пользователь не найден',
        };
      }
      return {
        success: true,
        message: 'Telegram пользователь найден',
        user,
      };
    } catch (error) {
      console.error('Ошибка получения telegram пользователя:', error);
      return {
        success: false,
        message: 'Ошибка получения пользователя',
      };
    }
  }

  @Post('favorites/add')
  async addToFavorites(@Body() body: { telegram_id: string; query: string }) {
    try {
      const favorite = await this.userService.addToFavorites(
        body.telegram_id,
        body.query,
      );
      return {
        success: true,
        message: 'Добавлено в избранное',
        favorite,
      };
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      return {
        success: false,
        message: 'Ошибка добавления в избранное',
      };
    }
  }

  @Post('favorites/remove')
  async removeFromFavorites(
    @Body() body: { telegram_id: string; query: string },
  ) {
    try {
      const result = await this.userService.removeFromFavorites(
        body.telegram_id,
        body.query,
      );
      return {
        success: true,
        message: 'Удалено из избранного',
        result,
      };
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      return {
        success: false,
        message: 'Ошибка удаления из избранного',
      };
    }
  }

  @Get('favorites/:telegram_id')
  async getFavorites(@Param('telegram_id') telegramId: string) {
    try {
      const favorites = await this.userService.getFavorites(telegramId);
      return {
        success: true,
        message: 'Избранное получено',
        favorites,
      };
    } catch (error) {
      console.error('Ошибка получения избранного:', error);
      return {
        success: false,
        message: 'Ошибка получения избранного',
      };
    }
  }

  @Get('favorites/:telegram_id/check/:query')
  async checkFavorite(
    @Param('telegram_id') telegramId: string,
    @Param('query') query: string,
  ) {
    try {
      const isFavorite = await this.userService.isFavorite(telegramId, query);
      return {
        success: true,
        message: 'Статус избранного получен',
        isFavorite,
      };
    } catch (error) {
      console.error('Ошибка проверки избранного:', error);
      return {
        success: false,
        message: 'Ошибка проверки избранного',
      };
    }
  }

  @Get('users/:username')
  async getUser(@Param('username') username: string) {
    const user = await this.userService.getUserByUsername(username);

    if (!user) {
      return { success: false, message: 'Пользователь не найден' };
    }

    return {
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}
