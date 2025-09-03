import { PrismaClient } from '@prisma/client';
import { TelegramInitDto } from '../dto/telegram.dto';

export interface User {
  id: string;
  username: string;
  role: string;
}

const prisma = new PrismaClient();

export class UserService {
  // Простая проверка пользователя
  async validateUser(username: string, password: string) {
    console.log('🔍 validateUser вызван с:', { username, password: password ? '***' : 'empty' });
    
    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log('🔍 Найденный пользователь:', user ? { id: user.id, username: user.username, role: user.role } : null);

    if (!user) {
      console.log('❌ Пользователь не найден');
      return null;
    }

    if (user.password !== password) {
      console.log('❌ Неверный пароль');
      return null;
    }

    console.log('✅ Пользователь валиден');
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  // Получение пользователя по ID
  async getUserById(id: string): Promise<User | null> {
    console.log('🔍 getUserById вызван с:', { id });
    
    const user = await prisma.user.findUnique({
      where: { id },
    });

    console.log('🔍 Найденный пользователь по ID:', user ? { id: user.id, username: user.username, role: user.role } : null);

    if (!user) {
      console.log('❌ Пользователь не найден по ID');
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  // Создание админа
  async createAdmin() {
    const existing = await prisma.user.findUnique({
      where: { username: 'pavlishev' },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: 'pavlishev',
          password: '171989Bkmz',
          role: 'admin',
        },
      });
      console.log('✅ Админ создан');
    }
  }

  // Сохранение telegram пользователя
  async saveTelegramUser(telegramUser: TelegramInitDto) {
    try {
      // Проверяем, существует ли пользователь
      const existingUser = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramUser.telegram_id },
      });

      if (existingUser) {
        console.log(
          '✅ Telegram пользователь уже существует:',
          existingUser.telegram_id,
        );
        return existingUser;
      } else {
        // Создаем нового пользователя с telegram_id
        const newUser = await prisma.telegramUser.create({
          data: {
            telegram_id: telegramUser.telegram_id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
          },
        });
        console.log('✅ Telegram пользователь создан:', newUser.telegram_id);
        return newUser;
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения telegram пользователя:', error);
      throw error;
    }
  }

  // Получение Telegram пользователя по telegram_id
  async getTelegramUser(telegramId: string) {
    try {
      const user = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramId },
      });

      if (!user) {
        console.log('❌ Telegram пользователь не найден:', telegramId);
        return null;
      }

      console.log('✅ Telegram пользователь найден:', user.telegram_id);
      return user;
    } catch (error) {
      console.error('❌ Ошибка получения telegram пользователя:', error);
      throw error;
    }
  }

  // Получение пользователя по username
  async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  // Добавление в избранное
  async addToFavorites(telegramId: string, query: string) {
    try {
      // Находим пользователя по telegram_id
      const user = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramId },
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Добавляем в избранное
      const favorite = await prisma.favorite.create({
        data: {
          telegram_user_id: user.id,
          query: query,
        },
      });

      console.log('✅ Добавлено в избранное:', {
        telegram_id: telegramId,
        query,
      });
      return favorite;
    } catch (error) {
      console.error('❌ Ошибка добавления в избранное:', error);
      throw error;
    }
  }

  // Удаление из избранного
  async removeFromFavorites(telegramId: string, query: string) {
    try {
      // Находим пользователя по telegram_id
      const user = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramId },
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Удаляем из избранного
      const deleted = await prisma.favorite.deleteMany({
        where: {
          telegram_user_id: user.id,
          query: query,
        },
      });

      console.log('✅ Удалено из избранного:', {
        telegram_id: telegramId,
        query,
      });
      return { success: true, deletedCount: deleted.count };
    } catch (error) {
      console.error('❌ Ошибка удаления из избранного:', error);
      throw error;
    }
  }

  // Получение избранного пользователя
  async getFavorites(telegramId: string) {
    try {
      // Находим пользователя по telegram_id
      const user = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramId },
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Получаем избранное пользователя
      const favorites = await prisma.favorite.findMany({
        where: {
          telegram_user_id: user.id,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      console.log('✅ Получено избранное для пользователя:', telegramId);
      return favorites;
    } catch (error) {
      console.error('❌ Ошибка получения избранного:', error);
      throw error;
    }
  }

  // Проверка, есть ли запрос в избранном
  async isFavorite(telegramId: string, query: string) {
    try {
      // Находим пользователя по telegram_id
      const user = await prisma.telegramUser.findUnique({
        where: { telegram_id: telegramId },
      });

      if (!user) {
        return false;
      }

      // Проверяем, есть ли в избранном
      const favorite = await prisma.favorite.findFirst({
        where: {
          telegram_user_id: user.id,
          query: query,
        },
      });

      return !!favorite;
    } catch (error) {
      console.error('❌ Ошибка проверки избранного:', error);
      return false;
    }
  }
}
