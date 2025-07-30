import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  // Простая проверка пользователя
  async validateUser(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.password !== password) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }

  // Создание админа
  async createAdmin() {
    const existing = await prisma.user.findUnique({
      where: { username: 'pavlishev' }
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          username: 'pavlishev',
          password: '171989Bkmz',
          role: 'admin'
        }
      });
      console.log('✅ Админ создан');
    }
  }

  // Получение пользователя по username
  async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }
} 