import { IphoneValidator } from '../src/services/validation.service/category/iphone.validator';

describe('iPhone Debug Test', () => {
  let iphoneValidator: IphoneValidator;

  beforeEach(() => {
    iphoneValidator = new IphoneValidator();
  });

  it('should debug iPhone 15 Pro validation', async () => {
    const testCases = [
      {
        query: 'iphone15pro',
        name: 'iPhone 15 Pro 128GB Natural Titanium',
        expected: true
      },
      {
        query: 'iphone15pro',
        name: 'Apple iPhone 15 Pro 256GB Blue Titanium',
        expected: true
      },
      {
        query: 'iphone15pro',
        name: 'iPhone 15 Pro Max 512GB',
        expected: false // должен быть отклонен, так как это Pro Max
      },
      {
        query: 'iphone15pro',
        name: 'iPhone 15 256GB Blue',
        expected: false // должен быть отклонен, так как это не Pro
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n=== Testing: ${testCase.name} ===`);
      const result = await iphoneValidator.validateSingleProduct(
        testCase.query,
        testCase.name,
        'iphone'
      );
      
      console.log(`Query: ${testCase.query}`);
      console.log(`Name: ${testCase.name}`);
      console.log(`Result:`, result);
      console.log(`Expected: ${testCase.expected}, Got: ${result.isValid}`);
      
      expect(result.isValid).toBe(testCase.expected);
    }
  });

  it('should debug iPhone 15 validation', async () => {
    const testCases = [
      {
        query: 'iphone15',
        name: 'iPhone 15 128GB Black',
        expected: true
      },
      {
        query: 'iphone15',
        name: 'Apple iPhone 15 256GB Blue',
        expected: true
      },
      {
        query: 'iphone15',
        name: 'iPhone 15 512GB Pink',
        expected: true
      },
      {
        query: 'iphone15',
        name: 'iPhone 15 Pro 256GB Blue',
        expected: false // должен быть отклонен, так как это Pro
      },
      {
        query: 'iphone15',
        name: 'iPhone 15 Pro Max 512GB',
        expected: false // должен быть отклонен, так как это Pro Max
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n=== Testing iPhone 15: ${testCase.name} ===`);
      const result = await iphoneValidator.validateSingleProduct(
        testCase.query,
        testCase.name,
        'iphone'
      );
      
      console.log(`Query: ${testCase.query}`);
      console.log(`Name: ${testCase.name}`);
      console.log(`Result:`, result);
      console.log(`Expected: ${testCase.expected}, Got: ${result.isValid}`);
      
      expect(result.isValid).toBe(testCase.expected);
    }
  });
}); 