import { MotherboardValidator } from '../src/validators/motherboard.validator';

describe('MotherboardValidator (batch e2e)', () => {
  const validator = new MotherboardValidator();
  // Батч: реальные и синтетические примеры + кейсы для AI
  const products = [
    { id: '1', name: 'ASUS PRIME B760M-A DDR4', price: 12000, query: 'B760', expected: true },
    { id: '2', name: 'MSI PRO B760M-P DDR4', price: 11000, query: 'B760', expected: true },
    { id: '3', name: 'GIGABYTE B760M DS3H DDR4', price: 11500, query: 'B760', expected: true },
    { id: '4', name: 'ASROCK B760M-HDV/M.2', price: 11200, query: 'B760', expected: true },
    { id: '5', name: 'Кабель SATA для B760', price: 300, query: 'B760', expected: false },
    { id: '6', name: 'Подставка для B760', price: 400, query: 'B760', expected: false },
    { id: '7', name: 'B760M наклейка', price: 200, query: 'B760', expected: false },
    { id: '8', name: 'B760', price: 10000, query: 'B760', expected: false }, // placeholder
    { id: '9', name: 'ASUS TUF GAMING B850-PLUS WIFI', price: 14000, query: 'B850', expected: true },
    { id: '10', name: 'GIGABYTE B850M D3HP DDR5', price: 13500, query: 'B850', expected: true },
    { id: '11', name: 'ASROCK B850M PRO RS', price: 13200, query: 'B850', expected: true },
    { id: '12', name: 'B850M сумка', price: 350, query: 'B850', expected: false },
    { id: '13', name: 'Z790M кабель', price: 250, query: 'Z790', expected: false },
    { id: '14', name: 'ASUS PRIME Z790M-PLUS D4', price: 17000, query: 'Z790', expected: true },
    { id: '15', name: 'GIGABYTE Z790 UD DDR5', price: 17500, query: 'Z790', expected: true },
    { id: '16', name: 'ASROCK Z790M-ITX', price: 17200, query: 'Z790', expected: true },
    { id: '17', name: 'X870E наклейка', price: 210, query: 'X870E', expected: false },
    { id: '18', name: 'ASUS ROG STRIX X870E-E GAMING WIFI', price: 21000, query: 'X870E', expected: true },
    { id: '19', name: 'MSI X870E CARBON WIFI', price: 20500, query: 'X870E', expected: true },
    { id: '20', name: 'GIGABYTE X870E AORUS ELITE', price: 20800, query: 'X870E', expected: true },
    { id: '21', name: 'X870E', price: 20000, query: 'X870E', expected: true }, // placeholder
    { id: '22', name: 'B760M', price: 10000, query: 'B760', expected: true }, // placeholder
    { id: '23', name: 'B760M кабель питания', price: 320, query: 'B760', expected: false },
    { id: '24', name: 'B760M наклейки', price: 220, query: 'B760', expected: false },
    { id: '25', name: 'B760M подставка', price: 420, query: 'B760', expected: false },
    { id: '26', name: 'B760M сумка', price: 350, query: 'B760', expected: false },
    { id: '27', name: 'B760M крепление', price: 410, query: 'B760', expected: false },
    { id: '28', name: 'B760M thermal pad', price: 230, query: 'B760', expected: false },
    { id: '29', name: 'B760M комплект', price: 330, query: 'B760', expected: false },
    { id: '30', name: 'B760M gift', price: 340, query: 'B760', expected: false },
    { id: '31', name: 'B760M brush', price: 210, query: 'B760', expected: false },
    { id: '32', name: 'B760M tool', price: 215, query: 'B760', expected: false },
    { id: '33', name: 'B760M screw', price: 218, query: 'B760', expected: false },
    { id: '34', name: 'B760M extension', price: 225, query: 'B760', expected: false },
    { id: '35', name: 'B760M adapter', price: 228, query: 'B760', expected: false },
    { id: '36', name: 'B760M splitter', price: 229, query: 'B760', expected: false },
    // AI-ambiguous cases:
    { id: '37', name: 'B760M X', price: 12000, query: 'B760', expected: true },
    { id: '38', name: 'B760M PRO', price: 12000, query: 'B760', expected: true },
    { id: '39', name: 'B760M GAMING', price: 12000, query: 'B760', expected: true },
    { id: '40', name: 'B760M ELITE', price: 12000, query: 'B760', expected: true },
    { id: '41', name: 'B760M LEGEND', price: 12000, query: 'B760', expected: true },
    { id: '42', name: 'B760M FROZEN', price: 12000, query: 'B760', expected: true },
    { id: '43', name: 'B760M STEEL', price: 12000, query: 'B760', expected: true },
    { id: '44', name: 'B760M NITRO', price: 12000, query: 'B760', expected: true },
    { id: '45', name: 'B760M V2', price: 12000, query: 'B760', expected: true },
    { id: '46', name: 'B760M D3HP', price: 12000, query: 'B760', expected: true },
    { id: '47', name: 'B760M DS3H', price: 12000, query: 'B760', expected: true },
    { id: '48', name: 'B760M RS', price: 12000, query: 'B760', expected: true },
    { id: '49', name: 'B760M M', price: 12000, query: 'B760', expected: true },
    { id: '50', name: 'B760M E', price: 12000, query: 'B760', expected: true },
    { id: '51', name: 'B760M OEM', price: 12000, query: 'B760', expected: true },
    { id: '52', name: 'B760M RTL', price: 12000, query: 'B760', expected: true },
    { id: '53', name: 'B760M PRIME', price: 12000, query: 'B760', expected: true },
    { id: '54', name: 'B760M TUF', price: 12000, query: 'B760', expected: true },
    { id: '55', name: 'B760M CHALLENGER', price: 12000, query: 'B760', expected: true },
    { id: '56', name: 'B760M ELITE', price: 12000, query: 'B760', expected: true },
    { id: '57', name: 'B760M PRO RS', price: 12000, query: 'B760', expected: true },
    { id: '58', name: 'B760M RIPTIDE', price: 12000, query: 'B760', expected: true },
    { id: '59', name: 'B760M TERMINATOR', price: 12000, query: 'B760', expected: true },
    { id: '60', name: 'B760M EAGLE', price: 12000, query: 'B760', expected: true },
  ];
  it('should validate batch of motherboards and accessories (AI cases included)', () => {
    let correct = 0;
    const errors: any[] = [];
    for (const p of products) {
      const result = validator.validate(p.query, p.name);
      if (result.isValid === p.expected) {
        correct++;
      } else {
        errors.push({ id: p.id, name: p.name, expected: p.expected, got: result.isValid, reason: result.reason });
      }
    }
    const accuracy = (correct / products.length) * 100;
    console.log(`MotherboardValidator accuracy: ${correct}/${products.length} (${accuracy.toFixed(1)}%)`);
    if (errors.length) {
      console.log('Errors:', errors);
    }
    expect(correct).toBe(products.length);
  });
}); 