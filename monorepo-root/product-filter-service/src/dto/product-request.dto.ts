import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional, ArrayNotEmpty } from 'class-validator';

export class ProductRequestDto {
  @ApiProperty({ type: [String], description: 'Список поисковых запросов' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  queries: string[];

  @ApiProperty({ description: 'Категория поиска', example: 'videocards' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ type: [String], description: 'Ключевые слова для исключения' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude_keywords?: string[];
} 