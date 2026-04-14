import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { App } from 'supertest/types';

describe('Rentals lifecycle (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let libraryId: number;
  let bookId: number;
  let stockId: number;
  let userId: number;
  let rentalId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/signin')
      .send({ login: 'admin', password: 'admin123' });
    token = res.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('setup: create library, book, stock, user', async () => {
    // Library
    const libRes = await request(app.getHttpServer() as App)
      .post('/api/v1/libraries')
      .set(auth())
      .send({ name: `Rental Test Lib ${Date.now()}` })
      .expect(201);
    libraryId = libRes.body.id;

    // Set admin user's adminLibraryId
    await request(app.getHttpServer() as App)
      .patch('/api/v1/users/1')
      .set(auth())
      .send({ adminLibraryId: libraryId })
      .expect(200);

    // Book (with bookRule)
    const bookRes = await request(app.getHttpServer() as App)
      .post('/api/v1/books')
      .set(auth())
      .send({
        name: `Rental Test Book ${Date.now()}`,
        bookRule: { price: 50000, rentDuration: 15 },
      })
      .expect(201);
    bookId = bookRes.body.id;

    // Stock
    const stockRes = await request(app.getHttpServer() as App)
      .post('/api/v1/stocks')
      .set(auth())
      .send({ bookId })
      .expect(201);
    stockId = stockRes.body.id;
    expect(stockRes.body.bookRule).toBeDefined();

    // User (reader) — passport ichida yaratiladi
    const passportId = `RT${Date.now()}`;
    const userRes = await request(app.getHttpServer() as App)
      .post('/api/v1/users')
      .set(auth())
      .send({
        firstName: 'Rental',
        lastName: 'Reader',
        phone: `99${Date.now().toString().slice(-7)}`,
        passport: { passportId },
      })
      .expect(201);
    userId = userRes.body.id;
    // User avtomatik adminLibraryId kutubxonasiga link bo'ldi
  });

  it('POST /rentals/check — pre-validate rental', async () => {
    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/rentals/check')
      .set(auth())
      .send({ readerId: userId, stockId })
      .expect(200);

    expect(res.body.eligible).toBe(true);
    expect(res.body.dueDate).toBeDefined();
  });

  it('POST /rentals — create rental', async () => {
    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/rentals')
      .set(auth())
      .send({ readerId: userId, stockId })
      .expect(201);

    rentalId = res.body.id;
    expect(res.body.readerId).toBe(userId);
    expect(res.body.stockId).toBe(stockId);
    expect(res.body.dueDate).toBeDefined();
  });

  it('POST /rentals — should fail (stock is busy)', async () => {
    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/rentals')
      .set(auth())
      .send({ readerId: userId, stockId })
      .expect(400);

    expect(res.body.message).toContain('band');
  });

  it('GET /rentals — list active rentals', async () => {
    const res = await request(app.getHttpServer() as App)
      .get('/api/v1/rentals?active=true')
      .set(auth())
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET /rentals/:id — get rental detail', async () => {
    const res = await request(app.getHttpServer() as App)
      .get(`/api/v1/rentals/${rentalId}`)
      .set(auth())
      .expect(200);

    expect(res.body.reader).toBeDefined();
    expect(res.body.stock).toBeDefined();
  });

  it('PATCH /rentals/:id — edit dueDate', async () => {
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 30);

    const res = await request(app.getHttpServer() as App)
      .patch(`/api/v1/rentals/${rentalId}`)
      .set(auth())
      .send({
        dueDate: newDueDate.toISOString(),
        note: 'Test muddat uzaytirish',
      })
      .expect(200);

    expect(res.body.dueDate).toBeDefined();
  });

  it('PATCH /rentals/:id/return — return book', async () => {
    const res = await request(app.getHttpServer() as App)
      .patch(`/api/v1/rentals/${rentalId}/return`)
      .set(auth())
      .send({ note: 'Qaytarildi' })
      .expect(200);

    expect(res.body.returnedAt).toBeDefined();
  });

  it('PATCH /rentals/:id/return — should fail (already returned)', async () => {
    await request(app.getHttpServer() as App)
      .patch(`/api/v1/rentals/${rentalId}/return`)
      .set(auth())
      .send({})
      .expect(400);
  });

  it('POST /rentals — create and reject', async () => {
    // Create a fresh stock for the reject test
    const newStockRes = await request(app.getHttpServer() as App)
      .post('/api/v1/stocks')
      .set(auth())
      .send({ bookId })
      .expect(201);

    const createRes = await request(app.getHttpServer() as App)
      .post('/api/v1/rentals')
      .set(auth())
      .send({ readerId: userId, stockId: newStockRes.body.id })
      .expect(201);

    const newRentalId = createRes.body.id;

    // Reject it
    const rejectRes = await request(app.getHttpServer() as App)
      .patch(`/api/v1/rentals/${newRentalId}/reject`)
      .set(auth())
      .send({ note: 'Kitob yo\'qoldi', stockStatus: 'LOST' })
      .expect(200);

    expect(rejectRes.body.rejected).toBe(true);
  });

  it('GET /rentals/report — expired rentals', async () => {
    const res = await request(app.getHttpServer() as App)
      .get('/api/v1/rentals/report')
      .set(auth())
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(res.body.meta).toBeDefined();
  });
});
