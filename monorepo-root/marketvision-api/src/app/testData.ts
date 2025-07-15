// Тестовые данные для маркет-дашборда

export interface MockHourlyCheapestItem {
  hour: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  marketPriceNote?: string;
  qwerty?: string;
  recommended?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

export const testProductsData: MockHourlyCheapestItem[] = [
  {
    hour: "13:00",
    name: "Apple Смартфон iPhone 16 Pro CN 128 ГБ, черный матовый",
    price: 70716,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-6/7652955462.jpg",
    link: "https://www.ozon.ru/product/apple-smartfon-iphone-16-pro-cn-128-gb-chernyy-matovyy-2195996713/?at=99trJ4YK0TBxMY34t3NOKKrC4Bj52mIgQXgAXIQBoOGv",
    source: "ozon",
    marketPriceNote: "Ниже рынка",
    qwerty: "iphone 16 pro",
    recommended: 90444.95,
    min: 70716,
    max: 91742,
    mean: 90444.95,
    median: 90300,
    iqr: [86000, 90932],
    category: "iphone",
  },
  {
    hour: "10:00",
    name: "Palit Видеокарта GeForce RTX 5090 RTX5090 GAMEROCK OC 32 ГБ (NE75090S19R5-GB2020G)",
    price: 241013,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-r/7371823491.jpg",
    link: "https://www.ozon.ru/product/palit-videokarta-geforce-rtx-5090-rtx5090-gamerock-oc-32-gb-ne75090s19r5-gb2020g-1922116038/?at=x6tPpE49rhgg3XvXi46vGz4tnmGRyqIQVXwxlU2zxyKG",
    source: "ozon",
    qwerty: "rtx 5090",
    min: 233992,
    max: 610006,
    mean: 326281.4375,
    median: 315600.5,
    iqr: [279499, 375420],
    category: "videocards",
  },
  {
    hour: "11:00",
    name: "Игровая приставка Nintendo Switch 2 256 ГБ, глобальная версия, черный",
    price: 35801,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-e/7601329022.jpg",
    link: "https://www.ozon.ru/product/igrovaya-pristavka-nintendo-switch-2-256-gb-globalnaya-versiya-chernyy-2350891360/?at=Y7tjKVJNGsMB4vjZtpEnPX4tE1ypyPF8wWN7ZhNPMD1Q",
    source: "ozon",
    qwerty: "nintendo switch 2",
    min: 35801,
    max: 191923,
    mean: 48854.34782608696,
    median: 48675,
    iqr: [40555, 56100],
    category: "nintendo_switch",
  },
  {
    hour: "12:00",
    name: "AX Gaming GeForce RTX 5070 X3W Видеокарта",
    price: 68583,
    image: "https://basket-23.wbbasket.ru/vol3936/part393679/393679964/images/big/1.webp",
    link: "https://www.wildberries.ru/catalog/393679964/detail.aspx",
    source: "wb",
    qwerty: "rtx 5070",
    min: 68583,
    max: 100000,
    mean: 80000,
    median: 80000,
    iqr: [70000, 90000],
    category: "videocards",
  },
  {
    hour: "14:00",
    name: "Sony Игровая приставка Sony PlayStation 5 Pro 2 ТБ, цифровая консоль , Поддержка Pусский язык",
    price: 61626,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-y/7474612174.jpg",
    link: "https://www.ozon.ru/product/sony-igrovaya-pristavka-sony-playstation-5-pro-2-tb-tsifrovaya-konsol-podderzhka-pusskiy-yazyk-1758814160/?at=99trJ4gMoFOw8J34FgxlK2qtWqoPjPux04K5GfLX2ypO",
    source: "ozon",
    qwerty: "playstation 5 pro",
    min: 61626,
    max: 100000,
    mean: 80000,
    median: 80000,
    iqr: [70000, 90000],
    category: "playstations",
  },
  {
    hour: "15:00",
    name: "GALAX Видеокарта GeForce RTX 4060 Ti 8 ГБ (489514757146)",
    price: 38635,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-y/7599286942.jpg",
    link: "https://www.ozon.ru/product/galax-videokarta-geforce-rtx-4060-ti-8-gb-489514757146-2245838324/?at=jYtZzoM3psgz2lN3uQq3k8JuY95DAwcpGMEY2CGQvLM3",
    source: "ozon",
    qwerty: "rtx 4060 ti",
    min: 38635,
    max: 100000,
    mean: 80000,
    median: 80000,
    iqr: [70000, 90000],
    category: "videocards",
  },
  {
    hour: "16:00",
    name: "Портативная игровая консоль Steam Deck OLED 16 ГБ + 512 ГБ, 7.4 -дюймовый OLED экран",
    price: 44791,
    image: "https://cdn1.ozone.ru/s3/multimedia-1-9/7209292833.jpg",
    link: "https://www.ozon.ru/product/portativnaya-igrovaya-konsol-steam-deck-oled-16-gb-512-gb-7-4-dyuymovyy-oled-ekran-2223511261/?at=mqtkVyKAEhl2LXnjinWwNvNuDBZqN5SJrm3oPtrn8zDn",
    source: "ozon",
    qwerty: "steam deck oled",
    min: 44791,
    max: 100000,
    mean: 80000,
    median: 80000,
    iqr: [70000, 90000],
    category: "playstations",
  },
  {
    hour: "17:00",
    name: "Материнская плата PRIME B850-PLUS WIF AM5 AMD B850 ATX RTL",
    price: 16930,
    image: "https://basket-22.wbbasket.ru/vol3903/part390385/390385298/images/big/1.webp",
    link: "https://www.wildberries.ru/catalog/390385298/detail.aspx",
    source: "wb",
    qwerty: "b850",
    min: 16930,
    max: 18601,
    mean: 17858.14285714286,
    median: 17841,
    iqr: [17480, 18157],
    category: "motherboards",
  },
  {
    hour: "18:00",
    name: "X870E AORUS ELITE WIFI7 материнская плата",
    price: 26288,
    image: "https://basket-21.wbbasket.ru/vol3660/part366098/366098215/images/big/1.webp",
    link: "https://www.wildberries.ru/catalog/366098215/detail.aspx",
    source: "wb",
    qwerty: "x870e",
    min: 26288,
    max: 100000,
    mean: 31000,
    median: 32000,
    iqr: [31000, 36000],
    category: "motherboards",
  },
];

export const mockDeals = [
  { id: 1, title: "RTX 5090 по суперцене!", price: 115000 },
  { id: 2, title: "iPhone 16 Pro скидка 10%", price: 135000 },
  { id: 3, title: "PlayStation 5 Pro bundle", price: 68000 },
];

export type Timeframe = 'day' | 'week' | 'month' | 'year';

export const chartData: Record<Timeframe, { label: string; current: number; recommended: number }[]> = {
  year: [
    { label: '2025', current: 241013, recommended: 260000 },
  ],
  month: [
    { label: 'Янв 2025', current: 500000, recommended: 260000 },
    { label: 'Фев 2025', current: 470000, recommended: 260000 },
    { label: 'Мар 2025', current: 430000, recommended: 260000 },
    { label: 'Апр 2025', current: 390000, recommended: 260000 },
    { label: 'Май 2025', current: 350000, recommended: 260000 },
    { label: 'Июн 2025', current: 300000, recommended: 260000 },
    { label: 'Июл 2025', current: 270000, recommended: 260000 },
    { label: 'Авг 2025', current: 241013, recommended: 260000 },
  ],
  week: [
    { label: 'Пн 29.07', current: 300000, recommended: 260000 },
    { label: 'Вт 30.07', current: 290000, recommended: 260000 },
    { label: 'Ср 31.07', current: 280000, recommended: 260000 },
    { label: 'Чт 01.08', current: 270000, recommended: 260000 },
    { label: 'Пт 02.08', current: 260000, recommended: 260000 },
    { label: 'Сб 03.08', current: 250000, recommended: 260000 },
    { label: 'Вс 04.08', current: 241013, recommended: 260000 },
  ],
  day: Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    const current = 260000 - i * 800;
    const recommended = 260000;
    return { label: hour, current, recommended };
  }),
};

export const recommendedPrice2024: Record<string, number> = {
  "iphone 16 pro": 75924,
  "rtx 5090": 250000,
  "nintendo switch 2": 40000,
  "rtx 5070": 80000,
  "playstation 5 pro": 70000,
  "rtx 4060 ti": 45000,
  "steam deck oled": 60000,
  "b850": 20000,
  "x870e": 35000,
}; 