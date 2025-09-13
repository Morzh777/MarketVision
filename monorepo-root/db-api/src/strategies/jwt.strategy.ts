import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../config/settings';

interface JwtPayload {
  type: string;
  userId: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
      issuer: 'marketvision-api',
      audience: 'marketvision-client',
    });
  }

  validate(payload: JwtPayload) {
    console.log('🔍 JWT Strategy validate called with payload:', payload);
    
    // Проверяем тип токена (должен быть 'user' для обычных запросов)
    if (payload.type !== 'user') {
      console.log('❌ Invalid token type:', payload.type);
      throw new UnauthorizedException('Неверный тип токена');
    }

    console.log('✅ JWT token valid for user:', payload.username);

    // Возвращаем данные пользователя
    return {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  }
}
