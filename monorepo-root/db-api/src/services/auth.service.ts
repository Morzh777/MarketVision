import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { JwtService, User } from './jwt.service';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Аутентификация пользователя
   * @param loginDto - данные для входа
   * @returns данные пользователя и токены
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`🔐 Попытка входа для пользователя: ${loginDto.login}`);

    try {
      // Проверка в базе данных
      const user = await this.validateCredentials(
        loginDto.login,
        loginDto.password,
      );

      if (!user) {
        this.logger.warn(
          `❌ Неверные данные для пользователя: ${loginDto.login}`,
        );
        throw new HttpException(
          'Неверные логин или пароль',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Создаем токены
      const tokens = this.jwtService.createTokenPair(user);

      this.logger.log(
        `✅ Успешная авторизация для пользователя: ${user.username}`,
      );

      return {
        success: true,
        auth: tokens.auth,
        refresh_token: tokens.refresh_token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Ошибка авторизации: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Внутренняя ошибка сервера',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Обновление токенов
   * @param refreshToken - refresh токен
   * @returns новые токены
   */
  refresh(refreshToken: string): LoginResponseDto {
    this.logger.log('🔄 Попытка обновления токена');

    try {
      // Проверяем refresh токен
      const user = this.jwtService.getUserFromToken(refreshToken);

      if (!user) {
        throw new HttpException(
          'Невалидный refresh токен',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Создаем новые токены
      const tokens = this.jwtService.createTokenPair(user);

      this.logger.log(`✅ Токены обновлены для пользователя: ${user.username}`);

      return {
        success: true,
        auth: tokens.auth,
        refresh_token: tokens.refresh_token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Ошибка обновления токена: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Внутренняя ошибка сервера',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Валидация учетных данных пользователя
   * @param login - логин пользователя
   * @param password - пароль пользователя
   * @returns данные пользователя или null
   */
  private async validateCredentials(
    login: string,
    password: string,
  ): Promise<User | null> {
    try {
      // Ищем пользователя в базе данных
      const user = await this.prisma.user.findUnique({
        where: { username: login },
      });

      if (!user) {
        this.logger.warn(`❌ Пользователь не найден: ${login}`);
        return null;
      }

      // Проверяем пароль с помощью bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`❌ Неверный пароль для пользователя: ${login}`);
        return null;
      }

      this.logger.log(`✅ Пользователь найден в БД: ${user.username}`);

      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error) {
      this.logger.error(
        `❌ Ошибка при поиске пользователя в БД: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Валидация токена
   * @param token - JWT токен
   * @returns данные пользователя или null
   */
  validateToken(token: string): User | null {
    return this.jwtService.getUserFromToken(token);
  }

  /**
   * Проверка валидности токена
   * @param token - JWT токен
   * @returns true если токен валиден
   */
  isTokenValid(token: string): boolean {
    return this.jwtService.isTokenValid(token);
  }

  createTestToken(user: User): LoginResponseDto {
    // Создаем тестовый токен с истечением через 30 секунд
    const auth = this.jwtService.createToken(user, '30s');
    const refresh_token = this.jwtService.createToken(user, '7d');
    
    return {
      success: true,
      auth,
      refresh_token,
      user,
    };
  }
}
