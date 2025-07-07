import { IsArray, IsString, IsNotEmpty, IsOptional, ArrayNotEmpty } from 'class-validator';

export class ProductRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  queries: string[];

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclude_keywords?: string[];
} 