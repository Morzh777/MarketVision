import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

export interface OpenAiProduct {
  id: string;
  name: string;
  price: number;
  query: string;
  toAI?: boolean;
  [key: string]: any;
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
    const universalPrompt = (products: OpenAiProduct[], category: string, query: string) => {
      const items = products.map(p => `Товар: "${p.name}", Запрос: "${p.query}"`).join('\n');
      return `Ты — профессиональный проверяющий комплектующих. Проверь каждый товар из списка на соответствие категории "${category}" и запросу "${query}".

${items}

Правила:
1. Валиден только тот товар, который действительно относится к категории "${category}" и его название содержит точное совпадение с запросом (query: ${query}).
2. Если в названии есть другая модель, серия, серия-модель, серия-модель-модель, товар невалиден.
3. Если в названии есть accessory-words (кабель, подставка, вентилятор, чехол, наклейка, сумка, сетка, кулер, переходник, крепление, пылезащитная, displayport, hdmi, usb-c и их английские аналоги), это аксессуар — невалидно.
4. Не делай предположений, не используй внешние знания — только анализируй текст name и query.
5. Ответь строго JSON-массивом вида: [{"id": string, "isValid": boolean, "reason": string}]. reason всегда объясняй, если isValid: false, иначе оставляй пустым. Не добавляй никакого текста до или после массива.

${JSON.stringify(products, null, 2)}
`;
    };
    let prompt = universalPrompt(products, category, query);
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