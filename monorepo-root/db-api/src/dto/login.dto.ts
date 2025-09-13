import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  success: boolean;
  auth: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}
