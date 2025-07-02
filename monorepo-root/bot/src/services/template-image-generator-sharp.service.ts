import sharp from 'sharp';
import fetch from 'node-fetch';
import * as path from 'path';
import * as fs from 'fs';

export interface ProductImageData {
  title: string;
  brand?: string;
  supplier?: string;
  price: number;
  previousPrice?: number;
  discount?: number;
  imageUrl?: string;
  category: string;
}

export class TemplateImageGeneratorSharpService {
  async generateProductImage(data: ProductImageData): Promise<Buffer> {
    // 1. Загружаем и ресайзим картинку товара
    const WIDTH = 900;
    const PRODUCT_HEIGHT = 900;
    const templatePath = path.join(__dirname, '../../media/wb_template.png');
    
    console.log(`🎨 Генерация изображения для: ${data.title}`);
    console.log(`📷 URL изображения: ${data.imageUrl || 'отсутствует'}`);

    let productImageBuffer: Buffer | null = null;
    if (data.imageUrl) {
      try {
        const response = await fetch(data.imageUrl);
        if (response.ok) {
          productImageBuffer = await response.buffer();
        } else {
          console.warn(`⚠️ Не удалось загрузить изображение: ${data.imageUrl} - статус: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка загрузки изображения ${data.imageUrl}:`, error);
      }
    }
    
    // Если изображение не загружено, создаем пустое изображение
    if (!productImageBuffer) {
      productImageBuffer = await sharp({
        create: {
          width: WIDTH,
          height: PRODUCT_HEIGHT,
          channels: 4,
          background: { r: 240, g: 240, b: 240, alpha: 1 }
        }
      })
      .png()
      .toBuffer();
    }
    
    const productResized = await sharp(productImageBuffer)
      .resize(WIDTH, PRODUCT_HEIGHT, { fit: 'cover' })
      .toBuffer();

    // 2. Загружаем шаблон (нижняя часть)
    const templateBuffer = fs.readFileSync(templatePath);
    const templateMeta = await sharp(templateBuffer).metadata();

    // 3. Склеиваем по вертикали
    const combinedHeight = PRODUCT_HEIGHT + (templateMeta.height || 0);
    const combined = await sharp({
      create: {
        width: WIDTH,
        height: combinedHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
      .composite([
        { input: productResized, top: 0, left: 0 },
        { input: templateBuffer, top: PRODUCT_HEIGHT, left: 0 }
      ])
      .png()
      .toBuffer();

    // 4. Добавляем текстовые данные поверх шаблона
    const priceFormatted = data.price.toLocaleString('ru-RU');
    const oldPriceFormatted = data.previousPrice ? data.previousPrice.toLocaleString('ru-RU') : '';
    const discount = data.discount || 0;
    const discountAmount = data.previousPrice ? data.previousPrice - data.price : 0;
    const discountAmountFormatted = discountAmount.toLocaleString('ru-RU');

    // SVG с текстом
    // Низкая цена: x:73 (63+10), y:25 (чуть ниже) относительно шаблона
    const priceX = 81;
    const priceY = 950;
    // Примерная ширина текста (можно уточнить)
    const priceWidth = priceFormatted.length * 25; // примерно 25px на символ для размера 43
    const oldPriceX = priceX + priceWidth + 15;
    const discountX = 730; // Ещё левее
    const triangleX = discountX - 25; // Треугольник левее текста скидки
    const titleX = priceX - 50;
    const titleY = priceY + 43 + 25;

    // Обрезаем строку до 40 символов, добавляем ... если длиннее
    let titleText = data.title;
    if (titleText.length > 40) {
      titleText = titleText.slice(0, 37) + '...';
    }

    const svg = `
      <svg width="900" height="${combinedHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="none"/>
        <!-- Новая (низкая) цена -->
        <text x="${priceX}" y="${priceY}" font-family="sans-serif" font-size="43" font-weight="600" fill="#FC4A5B" dominant-baseline="hanging">${priceFormatted}</text>
        <!-- Старая цена (выровнена по нижнему краю низкой цены) -->
        ${oldPriceFormatted ? `<text x="${oldPriceX}" y="${priceY + 30}" font-family="sans-serif" font-size="35" font-weight="600" fill="#C4C4C4" text-decoration="line-through">${oldPriceFormatted}</text>` : ''}
        <!-- Треугольник вниз перед процентом скидки -->
        ${discount > 0 ? `<polygon points="${triangleX},${priceY + 5} ${triangleX + 15},${priceY + 5} ${triangleX + 7.5},${priceY + 20}" fill="#8C8C8C"/>` : ''}
        <!-- Сумма экономии (в правом краю) -->
        ${discountAmount > 0 ? `<text x="${discountX}" y="${priceY+5}" font-family="sans-serif" font-size="35" font-weight="600" fill="#C4C4C4" dominant-baseline="hanging">-${discountAmountFormatted} ₽</text>` : ''}
        <!-- Титульник (название товара) в одну строку, без fade-out -->
        <text x="${titleX}" y="${titleY}" font-family="sans-serif" font-size="35" font-weight="600" fill="#C4C4C4" dominant-baseline="hanging">${titleText}</text>
      </svg>
    `;

    // Временный вывод SVG для отладки
    fs.writeFileSync('debug-svg.svg', svg);

    // 5. Накладываем SVG с текстом
    const final = await sharp(combined)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return final;
  }
} 