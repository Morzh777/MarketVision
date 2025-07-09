import { VideocardValidator } from '../src/validators/videocard.validator';

describe('VideocardValidator (batch e2e)', () => {
  const validator = new VideocardValidator();
  // Тот же батч, что и для OpenAI
  const products = [
    { id: '1', name: 'MSI GeForce RTX 5080 Gaming X Trio 24G GDDR7', price: 120000, query: 'RTX 5080' },
    { id: '2', name: 'Кабель питания PCI-E 8pin для видеокарты RTX 5080', price: 500, query: 'RTX 5080' },
    { id: '3', name: 'ASUS RTX 5080 TUF Gaming', price: 125000, query: 'RTX 5080' },
    { id: '4', name: 'Подставка для RTX 5080', price: 800, query: 'RTX 5080' },
    { id: '5', name: 'Palit RTX 5080 JetStream', price: 119000, query: 'RTX 5080' },
    { id: '6', name: 'Вентилятор для RTX 5080', price: 900, query: 'RTX 5080' },
    { id: '7', name: 'GIGABYTE RTX 5080 EAGLE', price: 121000, query: 'RTX 5080' },
    { id: '8', name: 'Сумка для RTX 5080', price: 1200, query: 'RTX 5080' },
    { id: '9', name: 'ZOTAC RTX 5080 AMP', price: 123000, query: 'RTX 5080' },
    { id: '10', name: 'Пылезащитная сетка RTX 5080', price: 400, query: 'RTX 5080' },
    { id: '11', name: 'Colorful RTX 5080 Ultra', price: 122000, query: 'RTX 5080' },
    { id: '12', name: 'Кулер для RTX 5080', price: 950, query: 'RTX 5080' },
    { id: '13', name: 'Inno3D RTX 5080 iChill', price: 124000, query: 'RTX 5080' },
    { id: '14', name: 'Переходник для RTX 5080', price: 600, query: 'RTX 5080' },
    { id: '15', name: 'Gainward RTX 5080 Phantom', price: 120500, query: 'RTX 5080' },
    { id: '16', name: 'Кабель HDMI для RTX 5080', price: 700, query: 'RTX 5080' },
    { id: '17', name: 'EVGA RTX 5080 FTW', price: 126000, query: 'RTX 5080' },
    { id: '18', name: 'Наклейки RTX 5080', price: 300, query: 'RTX 5080' },
    { id: '19', name: 'AORUS RTX 5080 MASTER', price: 127000, query: 'RTX 5080' },
    { id: '20', name: 'Чехол для RTX 5080', price: 1000, query: 'RTX 5080' },
    { id: '21', name: 'Palit RTX 5080 GamingPro', price: 120800, query: 'RTX 5080' },
    { id: '22', name: 'Крепление RTX 5080', price: 850, query: 'RTX 5080' },
    { id: '23', name: 'ASUS RTX 5080 Dual', price: 121500, query: 'RTX 5080' },
    { id: '24', name: 'Переходник DisplayPort для RTX 5080', price: 650, query: 'RTX 5080' },
    { id: '25', name: 'MSI RTX 5080 SUPRIM', price: 128000, query: 'RTX 5080' },
    { id: '26', name: 'Подставка для RTX 5080 Gaming', price: 900, query: 'RTX 5080' },
    { id: '27', name: 'GIGABYTE RTX 5080 GAMING OC', price: 122500, query: 'RTX 5080' },
    { id: '28', name: 'Кабель питания RTX 5080', price: 550, query: 'RTX 5080' },
    { id: '29', name: 'ZOTAC RTX 5080 Trinity', price: 123500, query: 'RTX 5080' },
    { id: '30', name: 'Сумка для RTX 5080 Gaming', price: 1100, query: 'RTX 5080' },
    { id: '31', name: 'Palit RTX 5080 GameRock', price: 121800, query: 'RTX 5080' },
    { id: '32', name: 'Пылезащитная сетка RTX 5080 Gaming', price: 450, query: 'RTX 5080' },
    { id: '33', name: 'ASUS RTX 5080 ProArt', price: 124500, query: 'RTX 5080' },
    { id: '34', name: 'Кулер для RTX 5080 Gaming', price: 980, query: 'RTX 5080' },
    { id: '35', name: 'Inno3D RTX 5080 X3', price: 125500, query: 'RTX 5080' },
    { id: '36', name: 'Переходник HDMI для RTX 5080', price: 620, query: 'RTX 5080' },
    { id: '37', name: 'Gainward RTX 5080 Ghost', price: 120900, query: 'RTX 5080' },
    { id: '38', name: 'Кабель DisplayPort для RTX 5080', price: 720, query: 'RTX 5080' },
    { id: '39', name: 'EVGA RTX 5080 XC', price: 126500, query: 'RTX 5080' },
    { id: '40', name: 'Наклейки RTX 5080 Gaming', price: 350, query: 'RTX 5080' },
    { id: '41', name: 'AORUS RTX 5080 XTREME', price: 127500, query: 'RTX 5080' },
    { id: '42', name: 'Чехол для RTX 5080 Gaming', price: 1050, query: 'RTX 5080' },
    { id: '43', name: 'Palit RTX 5080 StormX', price: 120300, query: 'RTX 5080' },
    { id: '44', name: 'Крепление RTX 5080 Gaming', price: 870, query: 'RTX 5080' },
    { id: '45', name: 'ASUS RTX 5080 Mini', price: 121900, query: 'RTX 5080' },
    { id: '46', name: 'Переходник USB-C для RTX 5080', price: 670, query: 'RTX 5080' },
    { id: '47', name: 'MSI RTX 5080 VENTUS', price: 128500, query: 'RTX 5080' },
    { id: '48', name: 'Подставка для RTX 5080 Mini', price: 950, query: 'RTX 5080' },
    { id: '49', name: 'GIGABYTE RTX 5080 AERO', price: 122800, query: 'RTX 5080' },
    { id: '50', name: 'Видеокарта RTX 5070super похоже на RTX5080', price: 730, query: 'RTX 5080' },
    { id: '51', name: 'Кабели питания для RTX 5080', price: 510, query: 'RTX 5080' },
    { id: '52', name: 'RTX 5080 наклейка', price: 320, query: 'RTX 5080' },
    { id: '53', name: 'RTX 5080 наклейки', price: 330, query: 'RTX 5080' },
    { id: '54', name: 'RTX 5080 наклеек', price: 340, query: 'RTX 5080' },
    { id: '55', name: 'RTX 5080 sticker', price: 350, query: 'RTX 5080' },
    { id: '56', name: 'RTX 5080 кабель', price: 360, query: 'RTX 5080' },
    { id: '57', name: 'RTX 5080 кабели', price: 370, query: 'RTX 5080' },
    { id: '58', name: 'RTX 5080 кабеля', price: 380, query: 'RTX 5080' },
    { id: '59', name: 'RTX 5080 DisplayPort', price: 390, query: 'RTX 5080' },
    { id: '60', name: 'RTX 5080 HDMI', price: 400, query: 'RTX 5080' },
    { id: '61', name: 'RTX 5080 USB-C', price: 410, query: 'RTX 5080' },
    { id: '62', name: 'RTX 5080 КУЛЕР', price: 420, query: 'RTX 5080' },
    { id: '63', name: 'RTX 5080 кулеры', price: 430, query: 'RTX 5080' },
    { id: '64', name: 'RTX 5080 крепления', price: 440, query: 'RTX 5080' },
    { id: '65', name: 'RTX 5080 крепление', price: 450, query: 'RTX 5080' },
    { id: '66', name: 'RTX 5080 Super', price: 129000, query: 'RTX 5080' }, // валидная
    { id: '67', name: 'RTX 5080 Ultra', price: 130000, query: 'RTX 5080' }, // валидная
    { id: '68', name: 'RTX 5080 Gaming', price: 131000, query: 'RTX 5080' }, // валидная
    { id: '69', name: 'RTX 5080', price: 132000, query: 'RTX 5080' }, // валидная
    { id: '70', name: 'Palit RTX 5080 GameRock', price: 121800, query: 'RTX 5080' }, // валидная (повтор)
    { id: '71', name: 'RTX 5080 наклейкой', price: 360, query: 'RTX 5080' },
    { id: '72', name: 'RTX 5080 наклейку', price: 370, query: 'RTX 5080' },
    { id: '73', name: 'RTX 5080 наклейки', price: 380, query: 'RTX 5080' },
    { id: '74', name: 'RTX 5080 наклеек', price: 390, query: 'RTX 5080' },
    { id: '75', name: 'RTX 5080 sticker pack', price: 400, query: 'RTX 5080' },
    { id: '76', name: 'RTX 5080 кабель питания', price: 410, query: 'RTX 5080' },
    { id: '77', name: 'RTX 5080 кабели питания', price: 420, query: 'RTX 5080' },
    { id: '78', name: 'RTX 5080 кабеля питания', price: 430, query: 'RTX 5080' },
    { id: '79', name: 'RTX 5080 DisplayPort кабель', price: 440, query: 'RTX 5080' },
    { id: '80', name: 'RTX 5080 HDMI кабель', price: 450, query: 'RTX 5080' },
    { id: '81', name: 'RTX 5080 USB-C кабель', price: 460, query: 'RTX 5080' },
  ];
  // Ожидание: аксессуары (любая форма) — невалидные, остальные — валидные
  const expected: Record<string, boolean> = {};
  for (let i = 1; i <= products.length; i++) {
    // Если название содержит accessory-слово — аксессуар (невалидный)
    const name = products[i-1].name.toLowerCase();
    const isAccessory = [
      'кабель', 'кабели', 'кабеля', 'подставка', 'подставки', 'вентилятор', 'вентиляторы', 'чехол', 'чехлы',
      'наклейка', 'наклейки', 'наклеек', 'наклейку', 'наклейкой', 'сумка', 'сумки', 'сетка', 'сетки',
      'кулер', 'кулеры', 'переходник', 'переходники', 'крепление', 'крепления', 'пылезащитная',
      'displayport', 'hdmi', 'usb-c', 'sticker', 'sticker pack'
    ].some(word => name.includes(word));
    expected[String(i)] = !isAccessory;
  }
  it('should validate batch of videocards and accessories', () => {
    let correct = 0;
    const errors: any[] = [];
    for (const p of products) {
      const result = validator.validate(p.query, p.name);
      if (result.isValid === expected[p.id]) {
        correct++;
      } else {
        errors.push({ id: p.id, name: p.name, expected: expected[p.id], got: result.isValid, reason: result.reason });
      }
    }
    const accuracy = (correct / products.length) * 100;
    console.log(`VideocardValidator accuracy: ${correct}/${products.length} (${accuracy.toFixed(1)}%)`);
    if (errors.length) {
      console.log('Errors:', errors);
    }
    expect(correct).toBe(products.length);
  });
}); 