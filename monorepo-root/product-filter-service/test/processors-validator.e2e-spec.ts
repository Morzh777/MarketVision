import { ProcessorsValidator } from '../src/validators/processors.validator';

describe('ProcessorsValidator (batch e2e)', () => {
  const validator = new ProcessorsValidator();
  // Батч продуктов: валидные и невалидные (аксессуары, placeholder, несколько моделей, edge-кейсы)
  const products = [
    // Валидные
    { id: '1', name: 'AMD Ryzen 7 7800X3D OEM (без кулера)', query: '7800x3d' },
    { id: '2', name: 'Процессор CPU AM5 AMD Ryzen 7 7800X3D (8C/16T, 3.8/5.1GHz, 96MB, 120W) OEM, 100-000000910', query: '7800x3d' },
    { id: '3', name: 'Ryzen 7 7800X3D AM5, 8 x 4200 МГц, OEM', query: '7800x3d' },
    { id: '4', name: 'AMD Ryzen 7 7800X3D 100-000000910', query: '7800x3d' },
    { id: '5', name: 'Процессор AMD Ryzen 7 7800X3D OEM (100-000000910)', query: '7800x3d' },
    { id: '6', name: 'Процессор Ryzen 7 7800X3D AM5, 8 x 4200 МГц', query: '7800x3d' },
    { id: '7', name: 'AMD Ryzen 7 7800X3D AM5 OEM', query: '7800x3d' },
    { id: '8', name: 'Процессор RYZEN 7 7800X3D OEM (100-000000910)', query: '7800x3d' },
    { id: '9', name: 'Ryzen7 7800X3D BOX CPU процессор', query: '7800x3d' },
    { id: '10', name: 'Процессор Ryzen 7 7800X3D, AM5, OEM', query: '7800x3d' },
    { id: '11', name: 'Intel Core i7-14700K BOX', query: 'i7-14700k' },
    { id: '12', name: 'Процессор Intel Core i9-13900KF OEM', query: 'i9-13900kf' },
    { id: '13', name: 'Intel Xeon Gold 6338 OEM', query: 'xeon 6338' },
    { id: '14', name: 'AMD Ryzen 9 7950X3D BOX', query: '7950x3d' },
    { id: '15', name: 'Процессор AMD Ryzen 5 7600X3D OEM', query: '7600x3d' },
    { id: '16', name: 'Процессор Intel Core i5-12400F BOX', query: 'i5-12400f' },
    { id: '17', name: 'Процессор Intel Pentium G6400 OEM', query: 'pentium g6400' },
    { id: '18', name: 'Процессор AMD Ryzen 7 7800X3D OEM (без кулера) BOX', query: '7800x3d' },
    { id: '19', name: 'Процессор AMD Ryzen 7 7800X3D OEM (без кулера) 4.2GHz', query: '7800x3d' },
    { id: '20', name: 'Процессор AMD Ryzen 7 7800X3D OEM (без кулера) 8 ядер 16 потоков', query: '7800x3d' },
    // Невалидные
    { id: '21', name: 'Кабель для процессора Ryzen 7 7800X3D', query: '7800x3d' },
    { id: '22', name: '7800X3D', query: '7800x3d' },
    { id: '23', name: 'Процессор Ryzen 7 7800X3D и Ryzen 9 7950X3D', query: '7800x3d' },
    { id: '24', name: 'Процессор для ПК', query: '7800x3d' },
    { id: '25', name: 'AMD Ryzen 7', query: '7800x3d' },
    { id: '26', name: 'Процессор Ryzen 7 7800X3D наклейка', query: '7800x3d' },
    { id: '27', name: 'Ryzen 7 7800X3D sticker', query: '7800x3d' },
    { id: '28', name: 'Процессор Ryzen 7 7800X3D Edition', query: '7800x3d' }, // edition — подозрительно, но допустим валидный (оставим true)
    { id: '29', name: 'Процессор Ryzen 7 7800X3D Limited Edition', query: '7800x3d' }, // Limited Edition — скорее всего невалидный (оставим false)
    { id: '30', name: 'Процессор Ryzen 7 7800X3D + кабель', query: '7800x3d' }, // аксессуар в комплекте
    { id: '31', name: 'Процессор Ryzen 7 7800X3D (наклейка в подарок)', query: '7800x3d' }, // аксессуар в подарок
    { id: '32', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелем)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '33', name: 'Процессор Ryzen 7 7800X3D (без кулера, с наклейкой)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '34', name: 'Процессор Ryzen 7 7800X3D (без кулера, с подставкой)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '35', name: 'Процессор Ryzen 7 7800X3D (без кулера, с вентилятором)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '36', name: 'Процессор Ryzen 7 7800X3D (без кулера, с сумкой)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '37', name: 'Процессор Ryzen 7 7800X3D (без кулера, с переходником)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '38', name: 'Процессор Ryzen 7 7800X3D (без кулера, с креплением)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '39', name: 'Процессор Ryzen 7 7800X3D (без кулера, с чехлом)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '40', name: 'Процессор Ryzen 7 7800X3D (без кулера, с пылезащитной сеткой)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '41', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кулером)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '42', name: 'Процессор Ryzen 7 7800X3D (без кулера, с переходником DisplayPort)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '43', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелем HDMI)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '44', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелем USB-C)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '45', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелем питания)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '46', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелями питания)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '47', name: 'Процессор Ryzen 7 7800X3D (без кулера, с кабелями)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '48', name: 'Процессор Ryzen 7 7800X3D (без кулера, с наклейками)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '49', name: 'Процессор Ryzen 7 7800X3D (без кулера, с наклейкой RTX)', query: '7800x3d' }, // аксессуар в комплекте
    { id: '50', name: 'Процессор Ryzen 7 7800X3D (без кулера, с наклейкой 7800X3D)', query: '7800x3d' }, // аксессуар в комплекте
  ];
  // Ожидание: аксессуары, placeholder, несколько моделей, отсутствие query, недостаточно признаков — невалидные, остальные — валидные
  const expected: Record<string, boolean> = {
    // Валидные
    '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true,
    '11': true, '12': true, '13': true, '14': true, '15': true, '16': true, '17': true, '18': true, '19': true, '20': true,
    // Невалидные
    '21': false, '22': false, '23': false, '24': false, '25': false, '26': false, '27': false, '28': true, '29': false,
    '30': false, '31': false, '32': false, '33': false, '34': false, '35': false, '36': false, '37': false, '38': false, '39': false, '40': false,
    '41': false, '42': false, '43': false, '44': false, '45': false, '46': false, '47': false, '48': false, '49': false, '50': false,
  };
  it('should validate batch of processors and accessories', () => {
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
    console.log(`ProcessorsValidator accuracy: ${correct}/${products.length} (${accuracy.toFixed(1)}%)`);
    if (errors.length) {
      console.log('Errors:', errors);
    }
    expect(correct).toBe(products.length);
  });
}); 