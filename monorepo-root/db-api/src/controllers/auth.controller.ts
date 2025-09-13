import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }): LoginResponseDto {
    return this.authService.refresh(body.refresh_token);
  }

  @Post('test-token')
  testToken(): LoginResponseDto {
    // Создаем тестовый токен с истечением через 30 секунд
    const user = { id: 'cmf488z8l0000li0hjbourhbx', username: 'pavlishev', role: 'admin' };
    return this.authService.createTestToken(user);
  }
}
