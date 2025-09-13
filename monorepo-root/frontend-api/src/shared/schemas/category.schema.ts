import { z } from 'zod'

// Запрещенные слова для защиты от инъекций
const FORBIDDEN_WORDS = ['script', 'select', 'insert', 'update', 'delete', 'drop', 'union']

/**
 * Схема валидации для категории
 */
export const categorySchema = z.object({
  key: z
    .string()
    .min(1, 'Ключ обязателен')
    .min(2, 'Ключ должен содержать минимум 2 символа')
    .max(50, 'Ключ не должен превышать 50 символов')
    .regex(/^[a-z0-9_-]+$/, 'Ключ может содержать только строчные буквы, цифры, дефисы и подчеркивания')
    .refine(val => !val.includes(' '), 'Ключ не должен содержать пробелы')
    .refine(val => !/[<>\"'&]/.test(val), 'Ключ содержит недопустимые символы')
    .refine(val => !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Ключ содержит недопустимые слова'),
  
  display: z
    .string()
    .min(1, 'Название обязательно')
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .refine(val => !/[<>\"'&]/.test(val), 'Название содержит недопустимые символы')
    .refine(val => !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Название содержит недопустимые слова'),
  
  ozon_id: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, 'OZ ID должен содержать минимум 2 символа')
    .refine((val) => !val || val.length <= 100, 'OZ ID не должен превышать 100 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'OZ ID содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'OZ ID содержит недопустимые слова'),
  
  wb_id: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 1, 'WB ID должен содержать минимум 1 символ')
    .refine((val) => !val || val.length <= 50, 'WB ID не должен превышать 50 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'WB ID содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'WB ID содержит недопустимые слова')
})

export type CategoryFormData = z.infer<typeof categorySchema>
