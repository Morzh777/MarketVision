import { PrismaClient } from '@prisma/client';
import { TelegramInitDto } from '../dto/telegram.dto';

const prisma = new PrismaClient();

export class UserService {
  // Простая проверка пользователя
  async validateUser(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
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
        where: { telegram_id: telegramUser.id.toString() },
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
            telegram_id: telegramUser.id.toString(),
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
}
