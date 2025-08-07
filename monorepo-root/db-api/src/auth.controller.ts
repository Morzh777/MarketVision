import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './services/userService';

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
