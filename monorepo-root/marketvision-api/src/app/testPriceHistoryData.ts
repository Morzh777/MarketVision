// Тестовые данные истории цен для всех товаров (почасовая динамика за сутки)
// Формат: { [qwerty: string]: PriceHistoryProduct[] }

import { testProductsData } from './testData';

export type PriceHistoryProduct = {
  id: string;
  query: string;
  source: string;
  price: number | null;
  created_at: string; // ISO-строка
};

function genPriceHistoryDay(basePrice: number, qwerty: string, source: string, hour: string): PriceHistoryProduct[] {
  // hour: "13:00" — до этого времени включительно, после — null
  const today = new Date();
  today.setMinutes(0, 0, 0);
  const arr: PriceHistoryProduct[] = [];
  const minPrice = Math.max(1000, Math.floor(basePrice * 0.8));
  const lastHour = parseInt(hour.split(":")[0], 10);
  for (let h = 0; h < 24; h++) {
    const date = new Date(today);
    date.setHours(h);
    let price: number | null;
    if (h < lastHour) {
      price = Math.max(minPrice, basePrice + Math.round((Math.sin(h / 3) + Math.random() - 0.5) * basePrice * 0.01));
    } else if (h === lastHour) {
      price = basePrice; // последняя точка — реальная цена
    } else {
      price = null; // после hour — нет данных
    }
    arr.push({
      id: `${qwerty.replace(/\s+/g, '_')}_day_${h.toString().padStart(2, '0')}:00`,
      query: qwerty,
      source,
      price,
      created_at: date.toISOString(),
    });
  }
  return arr;
}

export { genPriceHistoryDay, genPriceHistoryWeek, genPriceHistoryMonth, genPriceHistoryYear };

function genPriceHistoryWeek(basePrice: number, qwerty: string, source: string): PriceHistoryProduct[] {
  const now = new Date();
  const arr: PriceHistoryProduct[] = [];
  const minPrice = Math.max(1000, Math.floor(basePrice * 0.8));
  // Найти понедельник текущей недели
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + d);
    const price = Math.max(minPrice, basePrice + Math.round((Math.sin(d) + Math.random() - 0.5) * basePrice * 0.015));
    arr.push({
      id: `${qwerty.replace(/\s+/g, '_')}_week_${date.toISOString().slice(0,10)}`,
      query: qwerty,
      source,
      price,
      created_at: date.toISOString(),
    });
  }
  return arr;
}

function genPriceHistoryMonth(basePrice: number, qwerty: string, source: string): PriceHistoryProduct[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const arr: PriceHistoryProduct[] = [];
  const minPrice = Math.max(1000, Math.floor(basePrice * 0.8));
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const price = Math.max(minPrice, basePrice + Math.round((Math.sin(d / 3) + Math.random() - 0.5) * basePrice * 0.02));
    arr.push({
      id: `${qwerty.replace(/\s+/g, '_')}_month_${date.toISOString().slice(0,10)}`,
      query: qwerty,
      source,
      price,
      created_at: date.toISOString(),
    });
  }
  return arr;
}

function genPriceHistoryYear(basePrice: number, qwerty: string, source: string): PriceHistoryProduct[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const arr: PriceHistoryProduct[] = [];
  const minPrice = Math.max(1000, Math.floor(basePrice * 0.8));
  for (let m = 0; m < 12; m++) {
    const date = new Date(year, m, 1);
    const price = Math.max(minPrice, basePrice + Math.round((Math.sin(m) + Math.random() - 0.5) * basePrice * 0.03));
    arr.push({
      id: `${qwerty.replace(/\s+/g, '_')}_year_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`,
      query: qwerty,
      source,
      price,
      created_at: date.toISOString(),
    });
  }
  return arr;
}

export const priceHistoryMap: Record<string, { day: PriceHistoryProduct[]; week: PriceHistoryProduct[]; month: PriceHistoryProduct[]; year: PriceHistoryProduct[] }> = {};
testProductsData.forEach(({ qwerty, price, source, hour }) => {
  if (qwerty && price && source && hour) {
    priceHistoryMap[qwerty] = {
      day: genPriceHistoryDay(price, qwerty, source, hour),
      week: genPriceHistoryWeek(price, qwerty, source),
      month: genPriceHistoryMonth(price, qwerty, source),
      year: genPriceHistoryYear(price, qwerty, source),
    };
  }
}); 