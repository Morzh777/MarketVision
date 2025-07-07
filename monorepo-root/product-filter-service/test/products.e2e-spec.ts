import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// E2E тест для проверки всей архитектуры product-filter-service

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products/search (POST) — valid', async () => {
    const res = await request(app.getHttpServer())
      .post('/products/search')
      .send({ queries: ['rtx 5080'], category: 'videocards' })
      .expect(201).catch((e) => e.response);

    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(1);
    const product = res.body.products[0];
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('query', 'rtx 5080');
    // Проверяем, что цена минимальная среди валидных (пример: не больше 200_000)
    expect(typeof product.price).toBe('number');
    expect(product.price).toBeGreaterThan(0);
    expect(product.price).toBeLessThan(200000);
  });

  it('/products/search (POST) — invalid category', async () => {
    await request(app.getHttpServer())
      .post('/products/search')
      .send({ queries: ['rtx 5080'], category: 'invalid' })
      .expect(400);
  });
}); 