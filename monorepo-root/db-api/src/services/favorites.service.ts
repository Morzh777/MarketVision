import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { FavoriteAddDto, FavoriteRemoveDto } from '../dto/telegram.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prismaService: PrismaService) {}

  async addFavorite(favoriteDto: FavoriteAddDto) {
    try {
      // Находим или создаем пользователя Telegram
      let telegramUser = await this.prismaService.telegramUser.findUnique({
        where: { telegram_id: favoriteDto.telegram_id },
      });

      if (!telegramUser) {
        telegramUser = await this.prismaService.telegramUser.create({
          data: { telegram_id: favoriteDto.telegram_id },
        });
      }

      // Проверяем, есть ли уже такой запрос в избранном
      const existingFavorite = await this.prismaService.favorite.findFirst({
        where: {
          telegram_user_id: telegramUser.id,
          query: favoriteDto.query,
        },
      });

      if (existingFavorite) {
        return { success: true, message: 'Already in favorites' };
      }

      // Добавляем в избранное
      await this.prismaService.favorite.create({
        data: {
          telegram_user_id: telegramUser.id,
          query: favoriteDto.query,
        },
      });

      return { success: true, message: 'Added to favorites' };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, message: 'Failed to add to favorites' };
    }
  }

  async removeFavorite(favoriteDto: FavoriteRemoveDto) {
    try {
      // Находим пользователя Telegram
      const telegramUser = await this.prismaService.telegramUser.findUnique({
        where: { telegram_id: favoriteDto.telegram_id },
      });

      if (!telegramUser) {
        return { success: false, message: 'User not found' };
      }

      // Удаляем из избранного
      const result = await this.prismaService.favorite.deleteMany({
        where: {
          telegram_user_id: telegramUser.id,
          query: favoriteDto.query,
        },
      });

      if (result.count > 0) {
        return { success: true, message: 'Removed from favorites' };
      } else {
        return { success: false, message: 'Not in favorites' };
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, message: 'Failed to remove from favorites' };
    }
  }

  async checkFavorite(telegram_id: string, query: string) {
    try {
      // Находим пользователя Telegram
      const telegramUser = await this.prismaService.telegramUser.findUnique({
        where: { telegram_id },
      });

      if (!telegramUser) {
        return { success: true, isFavorite: false };
      }

      // Проверяем, есть ли запрос в избранном
      const favorite = await this.prismaService.favorite.findFirst({
        where: {
          telegram_user_id: telegramUser.id,
          query,
        },
      });

      return { success: true, isFavorite: !!favorite };
    } catch (error) {
      console.error('Error checking favorite:', error);
      return { success: false, isFavorite: false };
    }
  }

  async getFavorites(telegram_id: string) {
    try {
      // Находим пользователя Telegram
      const telegramUser = await this.prismaService.telegramUser.findUnique({
        where: { telegram_id },
      });

      if (!telegramUser) {
        return { success: true, favorites: [] };
      }

      // Получаем все избранные запросы
      const favorites = await this.prismaService.favorite.findMany({
        where: { telegram_user_id: telegramUser.id },
        orderBy: { created_at: 'desc' },
      });

      return { success: true, favorites };
    } catch (error) {
      console.error('Error getting favorites:', error);
      return { success: false, favorites: [] };
    }
  }
}
