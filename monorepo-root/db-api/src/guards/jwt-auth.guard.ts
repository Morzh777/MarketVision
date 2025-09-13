import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtUser {
  id: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔍 JwtAuthGuard canActivate called');
    return super.canActivate(context);
  }

  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: TUser | null,
    info: unknown,
  ): TUser {
    console.log('🔍 JwtAuthGuard handleRequest called', { err, user, info });
    if (err || !user) {
      console.log('❌ JwtAuthGuard: Authentication failed', { err, info });
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
