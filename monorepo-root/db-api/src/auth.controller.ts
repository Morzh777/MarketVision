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
