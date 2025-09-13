import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { FavoriteAddDto, FavoriteRemoveDto } from '../dto/telegram.dto';
import { FavoritesService } from '../services/favorites.service';

@Controller('auth/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('add')
  async addFavorite(@Body() favoriteDto: FavoriteAddDto) {
    return this.favoritesService.addFavorite(favoriteDto);
  }

  @Post('remove')
  async removeFavorite(@Body() favoriteDto: FavoriteRemoveDto) {
    return this.favoritesService.removeFavorite(favoriteDto);
  }

  @Get('check')
  async checkFavorite(
    @Query('telegram_id') telegram_id: string,
    @Query('query') query: string,
  ) {
    return this.favoritesService.checkFavorite(telegram_id, query);
  }

  @Get()
  async getFavorites(@Query('telegram_id') telegram_id: string) {
    return this.favoritesService.getFavorites(telegram_id);
  }
}
