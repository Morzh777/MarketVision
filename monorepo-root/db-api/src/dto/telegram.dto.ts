import { IsString, IsOptional, MinLength } from 'class-validator';

export class TelegramInitDto {
  @IsString()
  @MinLength(1)
  telegram_id!: string; // Telegram User ID as string (matches database telegram_id field)

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;
}

export class FavoriteAddDto {
  @IsString()
  @MinLength(1)
  telegram_id!: string;

  @IsString()
  @MinLength(1)
  query!: string;
}

export class FavoriteRemoveDto {
  @IsString()
  @MinLength(1)
  telegram_id!: string;

  @IsString()
  @MinLength(1)
  query!: string;
}

export class FavoriteGetDto {
  @IsString()
  @MinLength(1)
  telegram_id!: string;
}
