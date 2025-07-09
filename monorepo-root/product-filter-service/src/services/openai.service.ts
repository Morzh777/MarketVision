import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

export interface OpenAiProduct {
  id: string;
  name: string;
  price: number;
  query: string;
}

export interface OpenAiValidationResult {
  id: string;
  isValid: boolean;
  reason?: string;
}

@Injectable()
export class OpenAiValidationService {
  private readonly logger = new Logger(OpenAiValidationService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly defaultModel = process.env.OPENAI_MODEL || 'gpt-3o';

  async validateProducts(products: OpenAiProduct[], category: string, modelOverride?: string): Promise<OpenAiValidationResult[]> {
    const model = modelOverride || this.defaultModel;
    if (products.length === 0) return [];
    const query = products[0].query;
    if (!products.every(p => p.query === query)) {
      throw new Error('Все товары в батче должны иметь одинаковый query');
    }
    const prompts: Record<string, (products: OpenAiProduct[], query: string) => string> = {
      'видеокарта': (products, query) => `Ты — эксперт по фильтрации товаров. Твоя задача — определить, является ли товар настоящей видеокартой.

Правила:
1. Если в названии есть accessory-words (sticker, bag, cable, fan, edition, pack, bracket, holder, stand, cover, case, mount, adapter, splitter, extension, cooler, thermal, pad, screw, tool, cleaner, brush, limited, set, kit и их русские аналоги: кабель, подставка, вентилятор, чехол, наклейка, сумка, сетка, кулер, переходник, крепление, пылезащитная, displayport, hdmi, usb-c) — это аксессуар, всегда невалидно.
2. Если в названии есть две или более модели (например, RTX 5080 и RTX 5070) — это невалидно, кроме случаев, когда это комплект из двух видеокарт.
3. Если есть опечатки, транслит, CAPSLOCK, слитное написание — считать валидным, если это не аксессуар.
4. Короткие названия (например, "RTX 5080" или "RTX5080") считаются валидными, если это реально существующая модель.
5. Если название совсем не содержит модель — невалидно.

Примеры:
- "Palit RTX 5080 GamingPro 16GB" — валидно
- "RTX 5080" — валидно (короткое, но это реальная модель)
- "RTX5080" — валидно (слитно, но это реальная модель)
- "RTX 5080 sticker" — невалидно (accessory)
- "RTX 5080 FAN" — невалидно (accessory)
- "Palit RTX 5080 GameRock Limited Edition RTX 5070" — невалидно (две модели)
- "Видеокарта RTX 5080" — невалидно (placeholder)
- "RTX5080 GAMINGPRO 16GB" — валидно
- "RTX 5080 16GB" — невалидно (нет бренда/серии)
- "Palit RTX 5080 GameRock Llmited" — валидно (опечатка)
- "Palit RTX 5080 GameRock Limited Edition" — валидно (если это не аксессуар)

Ответь строго JSON-массивом вида: [{"id": string, "isValid": boolean, "reason": string}]. reason всегда объясняй, если isValid: false, иначе оставляй пустым. Не добавляй никакого текста до или после массива.

${JSON.stringify(products, null, 2)}
`,
      'процессор': (products, query) => `Проверь список товаров. Валидным считается только настоящий товар категории "процессор" (CPU), если его название (name) содержит текст запроса (query: ${query}) и не содержит признаков аксессуара.

Аксессуаром считается товар, если в его названии есть хотя бы одно из слов: кулер, термопаста, подставка, вентилятор, чехол, наклейка, сумка, сетка, переходник, крепление, пылезащитная, displayport, hdmi, usb-c.

Если товар — аксессуар, он НЕвалиден, даже если в названии есть query.

Не используй свои знания о брендах и моделях, не делай предположений — только анализируй текст name и query.

Ответь строго JSON-массивом вида: [{"id": string, "isValid": boolean, "reason": string}]. reason указывай только если isValid: false, иначе оставляй пустым. Не добавляй никакого текста до или после массива.

Пример:
[{"id": "1", "name": "Intel Core i9-14900K", "query": "i9-14900K"}, {"id": "2", "name": "Кулер для процессора", "query": "i9-14900K"}]
Ответ:
[{"id": "1", "isValid": true, "reason": ""}, {"id": "2", "isValid": false, "reason": "аксессуар"}]

${JSON.stringify(products, null, 2)}
`,
    };
    const defaultPrompt = (products: OpenAiProduct[], category: string, query: string) => `
Проверь список товаров. Валидным считается только настоящий товар категории "${category}", если его название (name) содержит текст запроса (query: ${query}) и не содержит признаков аксессуара или другого типа товара.

Аксессуаром считается товар, если в его названии есть хотя бы одно из слов: кабель, подставка, вентилятор, чехол, наклейка, сумка, сетка, кулер, переходник, крепление, пылезащитная, displayport, hdmi, usb-c.

Если товар — аксессуар или что-либо кроме "${category}", он НЕвалиден, даже если в названии есть query.

Не используй свои знания о брендах и моделях, не делай предположений — только анализируй текст name и query.

Ответь строго JSON-массивом вида: [{"id": string, "isValid": boolean, "reason": string}]. reason указывай только если isValid: false, иначе оставляй пустым. Не добавляй никакого текста до или после массива.

${JSON.stringify(products, null, 2)}
`;
    const prompt = prompts[category]
      ? prompts[category](products, query)
      : defaultPrompt(products, category, query);
    // Определяем, какую опцию токенов использовать
    const useMaxCompletionTokens = /(^o3|^o4|mini|nano)/.test(model);
    const body: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };
    if (useMaxCompletionTokens) {
      body.max_completion_tokens = 8192;
    } else {
      body.max_tokens = 8192;
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    // Логируем весь ответ, если content пустой или не содержит массив
    if (!content || !content.includes('[')) {
      this.logger.error('RAW OPENAI API RESPONSE:', JSON.stringify(data, null, 2));
    }
    // Сохраняем сырой ответ OpenAI в файл для отладки
    const fs = require('fs');
    const path = require('path');
    const rawOutPath = path.join(__dirname, '../../test/openai-raw-response.json');
    fs.writeFileSync(rawOutPath, JSON.stringify({ content, data }, null, 2), 'utf-8');
    try {
      let arr;
      try {
        arr = JSON.parse(content);
      } catch {
        const match = content.match(/\[.*\]/s);
        if (!match) throw new Error('Ответ не содержит JSON-массив');
        arr = JSON.parse(match[0]);
      }
      for (const r of arr) {
        const product = products.find(p => p.id === r.id);
        if (product && isAccessory(product.name)) {
          r.isValid = false;
          r.reason = 'аксессуар';
        }
      }
      return arr;
    } catch (e) {
      this.logger.error('Ошибка парсинга ответа OpenAI', e);
      throw new Error('Ошибка парсинга ответа OpenAI');
    }
  }
}

const ACCESSORY_WORDS = [
  'кабель', 'подставка', 'вентилятор', 'чехол', 'наклейка', 'сумка', 'сетка', 'кулер', 'переходник', 'крепление', 'пылезащитная', 'displayport', 'hdmi', 'usb-c'
];
function isAccessory(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCESSORY_WORDS.some(word => lower.includes(word));
} 