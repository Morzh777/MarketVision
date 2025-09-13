import { z } from 'zod'

// Запрещенные слова для защиты от инъекций
const FORBIDDEN_WORDS = ['script', 'select', 'insert', 'update', 'delete', 'drop', 'union']

/**
 * Схема валидации для запроса
 */
export const querySchema = z.object({
  query: z
    .string()
    .min(1, 'Запрос обязателен')
    .min(2, 'Запрос должен содержать минимум 2 символа')
    .max(200, 'Запрос не должен превышать 200 символов')
    .refine(val => !/[<>\"'&]/.test(val), 'Запрос содержит недопустимые символы')
    .refine(val => !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Запрос содержит недопустимые слова'),
  
  platform: z
    .enum(['both', 'ozon', 'wb'], {
      errorMap: () => ({ message: 'Выберите корректную платформу' })
    }),
  
  platform_id: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, 'Ozon Platform ID должен содержать минимум 2 символа')
    .refine((val) => !val || val.length <= 200, 'Ozon Platform ID не должен превышать 200 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'Ozon Platform ID содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Ozon Platform ID содержит недопустимые слова'),
  
  exactmodels: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, 'Ozon Exact Models должен содержать минимум 2 символа')
    .refine((val) => !val || val.length <= 200, 'Ozon Exact Models не должен превышать 200 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'Ozon Exact Models содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'Ozon Exact Models содержит недопустимые слова'),
  
  wb_platform_id: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 1, 'WB Platform ID должен содержать минимум 1 символ')
    .refine((val) => !val || val.length <= 50, 'WB Platform ID не должен превышать 50 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'WB Platform ID содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'WB Platform ID содержит недопустимые слова'),
  
  wb_exactmodels: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, 'WB Exact Models должен содержать минимум 2 символа')
    .refine((val) => !val || val.length <= 200, 'WB Exact Models не должен превышать 200 символов')
    .refine((val) => !val || !/[<>\"'&]/.test(val), 'WB Exact Models содержит недопустимые символы')
    .refine((val) => !val || !FORBIDDEN_WORDS.some(word => val.toLowerCase().includes(word)), 'WB Exact Models содержит недопустимые слова'),
  
  recommended_price: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const num = Number(val)
      return !isNaN(num) && num >= 0
    }, 'Рекомендуемая цена должна быть положительным числом')
    .refine((val) => {
      if (!val) return true
      const num = Number(val)
      return num <= 10000000
    }, 'Рекомендуемая цена не должна превышать 10,000,000'),
  
  categoryKey: z
    .string()
    .min(1, 'Категория обязательна')
})

export type QueryFormData = z.infer<typeof querySchema>
