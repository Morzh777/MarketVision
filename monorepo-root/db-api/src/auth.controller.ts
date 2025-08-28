import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './services/userService';
import { TelegramInitDto } from './dto/telegram.dto';

@Controller('auth')
export class AuthController {
  constructor(private userService: UserService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.userService.validateUser(
      body.username,
      body.password,
    );

    if (!user) {
      return { success: false, message: 'Неверный логин или пароль' };
    }

    return {
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
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
      const favorite = await this.userService.addToFavorites(body.telegram_id, body.query);
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
  async removeFromFavorites(@Body() body: { telegram_id: string; query: string }) {
    try {
      const result = await this.userService.removeFromFavorites(body.telegram_id, body.query);
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
