require('dotenv').config();
import { OpenAiValidationService } from '../src/services/openai.service';

describe('O4-mini AI Validator (pure AI, batch e2e)', () => {
  const openai = new OpenAiValidationService();
  const products = [
    { id: '1', name: 'MSI GeForce RTX 5080 Gaming X Trio 24G GDDR7', price: 120000, query: 'RTX 5080' },
    { id: '2', name: 'Кабель питания PCI-E 8pin для видеокарты RTX 5080', price: 500, query: 'RTX 5080' },
    { id: '3', name: 'ASUS RTX 5080 TUF Gaming', price: 125000, query: 'RTX 5080' },
    { id: '4', name: 'RTX 5080 sticker', price: 350, query: 'RTX 5080' },
    { id: '5', name: 'Palit RTX 5080 JetStream', price: 119000, query: 'RTX 5080' },
    { id: '6', name: 'Видеокарта RTX 5070super похоже на RTX5080', price: 730, query: 'RTX 5080' },
    { id: '7', name: 'RTX 5080 наклейки', price: 330, query: 'RTX 5080' },
    { id: '8', name: 'RTX 5080', price: 132000, query: 'RTX 5080' },
    { id: '9', name: 'RTX5080', price: 132100, query: 'RTX 5080' },
    { id: '10', name: 'Palit RTX-5080 GameRock', price: 121800, query: 'RTX 5080' },
    { id: '11', name: 'MSI RTX 5080 GAMING X TRIO', price: 120100, query: 'RTX 5080' },
    { id: '12', name: 'Кабель для RTX5080', price: 510, query: 'RTX 5080' },
    { id: '13', name: 'RTX 5080 power cable', price: 520, query: 'RTX 5080' },
    { id: '14', name: 'RTX 5080 наклейка', price: 330, query: 'RTX 5080' },
    { id: '15', name: 'RTX 5080 наклейкой', price: 340, query: 'RTX 5080' },
    { id: '16', name: 'RTX 5080 наклейку', price: 350, query: 'RTX 5080' },
    { id: '17', name: 'RTX 5080 sticker pack', price: 360, query: 'RTX 5080' },
    { id: '18', name: 'RTX 5080 сумка', price: 370, query: 'RTX 5080' },
    { id: '19', name: 'RTX 5080 bag', price: 380, query: 'RTX 5080' },
    { id: '20', name: 'RTX 5080 FAN', price: 390, query: 'RTX 5080' },
    { id: '21', name: 'RTX 5080 вентилятор', price: 400, query: 'RTX 5080' },
    { id: '22', name: 'RTX 5080 DisplayPort', price: 410, query: 'RTX 5080' },
    { id: '23', name: 'RTX 5080 HDMI', price: 420, query: 'RTX 5080' },
    { id: '24', name: 'RTX 5080 USB-C', price: 430, query: 'RTX 5080' },
    { id: '25', name: 'Palit RTX 5080 GameRock', price: 121800, query: 'RTX 5080' },
    { id: '26', name: 'Palit RTX 5080 GameRock (2024)', price: 121900, query: 'RTX 5080' },
    { id: '27', name: 'Palit RTX 5080 GameRock Limited Edition', price: 122000, query: 'RTX 5080' },
    { id: '28', name: 'Palit RTX 5080 GameRock Limited', price: 122100, query: 'RTX 5080' },
    { id: '29', name: 'Palit RTX 5080 GameRock Limitede', price: 122200, query: 'RTX 5080' },
    { id: '30', name: 'Palit RTX 5080 GameRock Limite', price: 122300, query: 'RTX 5080' },
    { id: '31', name: 'Palit RTX 5080 GameRock Lim1ted', price: 122400, query: 'RTX 5080' },
    { id: '32', name: 'Palit RTX 5080 GameRock L1mited', price: 122500, query: 'RTX 5080' },
    { id: '33', name: 'Palit RTX 5080 GameRock L!mited', price: 122600, query: 'RTX 5080' },
    { id: '34', name: 'Palit RTX 5080 GameRock Llmited', price: 122700, query: 'RTX 5080' },
    { id: '35', name: 'Palit RTX 5080 GameRock Limlted', price: 122800, query: 'RTX 5080' },
    { id: '36', name: 'Palit RTX 5080 GameRock Limlt3d', price: 122900, query: 'RTX 5080' },
    { id: '37', name: 'Palit RTX 5080 GameRock Limlt3d Edition', price: 123000, query: 'RTX 5080' },
    { id: '38', name: 'Palit RTX 5080 GameRock Limited Edition RTX 5070', price: 123100, query: 'RTX 5080' },
    { id: '39', name: 'Palit RTX 5070 GameRock', price: 121800, query: 'RTX 5080' },
    { id: '40', name: 'Palit RTX 5080 GameRock + кабель', price: 121800, query: 'RTX 5080' },
  ];
  // Ожидание: аксессуары — невалидные, остальные — валидные (AI может ошибиться на id:6, 29-37, 38, 39, 40)
  const expected: Record<string, boolean> = {};
  for (const p of products) {
    const name = p.name.toLowerCase();
    const isAccessory = [
      'кабель', 'sticker', 'наклейка', 'наклейки', 'наклейкой', 'наклейку', 'наклеек', 'сумка', 'bag', 'fan', 'вентилятор', 'displayport', 'hdmi', 'usb-c', 'power cable'
    ].some(word => name.includes(word));
    if (isAccessory || p.id === '39' || p.id === '6' || p.id === '38' || p.id === '40') {
      expected[p.id] = false;
    } else {
      expected[p.id] = true;
    }
  }
  it('should validate batch of products with pure o3-mini AI', async () => {
    const results = await openai.validateProducts(products, 'видеокарта', 'o3-mini-2025-01-31');
    let correct = 0;
    const errors: any[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const r = results[i];
      if (r.isValid === expected[p.id]) {
        correct++;
      } else {
        errors.push({ id: p.id, name: p.name, expected: expected[p.id], got: r.isValid, reason: r.reason });
      }
    }
    const accuracy = (correct / products.length) * 100;
    console.log(`O3-mini AI Validator accuracy: ${correct}/${products.length} (${accuracy.toFixed(1)}%)`);
    if (errors.length) {
      console.log('Errors:', errors);
    }
    expect(correct).toBeGreaterThanOrEqual(products.length - 3); // допускаем 3 ошибки на AI edge-cases
  }, 90000); // увеличенный таймаут
}); 