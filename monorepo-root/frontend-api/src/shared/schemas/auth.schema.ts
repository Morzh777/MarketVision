import { z } from 'zod'

// Запрещенные слова для защиты от инъекций
const FORBIDDEN_WORDS = ['script', 'select', 'insert', 'update', 'delete', 'drop', 'union']

/**
 * Схема валидации для формы авторизации
 */
export const loginSchema = z.object({
  login: z
    .string()
    .min(1, 'Логин обязателен')
    .min(3, 'Логин должен содержать минимум 3 символа')
    .max(50, 'Логин не должен превышать 50 символов')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Логин может содержать только английские буквы, цифры, дефисы и подчеркивания')
    .refine(val => !val.includes(' '), 'Логин не должен содержать пробелы')
    .refine(val => !/[<>\"'&]/.test(val), 'Логин содержит недопустимые символы')
    .refine(val => !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Логин содержит недопустимые слова'),
  password: z
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль не должен превышать 100 символов')
    .refine(val => !val.includes(' '), 'Пароль не должен содержать пробелы')
    .refine(val => !/[<>\"'&]/.test(val), 'Пароль содержит недопустимые символы')
    .refine(val => !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Пароль содержит недопустимые слова')
})

export type LoginFormData = z.infer<typeof loginSchema>
