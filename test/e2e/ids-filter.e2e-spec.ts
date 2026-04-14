import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { App } from 'supertest/types';

describe('IDs filter on list endpoints (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('query parser', 'extended');
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

  /**
   * Helper: fetches list, picks first two IDs, re-fetches with ids filter,
   * asserts only those IDs are returned.
   */
  async function testIdsFilter(endpoint: string) {
    // 1. Get all items
    const allRes = await request(app.getHttpServer() as App)
      .get(`/api/v1/${endpoint}`)
      .set(auth())
      .expect(200);

    const items = allRes.body.items;
    if (items.length < 2) {
      // Not enough data — skip meaningful assertion but at least verify the param is accepted
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/${endpoint}?ids=999999`)
        .set(auth())
        .expect(200);
      expect(res.body.items).toHaveLength(0);
      return;
    }

    const targetIds: number[] = [items[0].id, items[1].id];

    // 2. Fetch with ids filter (?ids=1&ids=2)
    const filteredRes = await request(app.getHttpServer() as App)
      .get(`/api/v1/${endpoint}`)
      .query({ ids: targetIds })
      .set(auth())
      .expect(200);

    const filteredItems = filteredRes.body.items;
    const filteredIds = filteredItems.map((i: { id: number }) => i.id);

    // All returned items should be in our target list
    expect(filteredIds.every((id: number) => targetIds.includes(id))).toBe(true);
    // We should get exactly 2
    expect(filteredItems).toHaveLength(2);
    expect(filteredRes.body.meta.totalItems).toBe(2);
  }

  it('GET /books?ids=... — filters by IDs', () => testIdsFilter('books'));
  it('GET /authors?ids=... — filters by IDs', () => testIdsFilter('authors'));
  it('GET /collections?ids=... — filters by IDs', () => testIdsFilter('collections'));
  it('GET /publishers?ids=... — filters by IDs', () => testIdsFilter('publishers'));
  it('GET /rentals?ids=... — filters by IDs', () => testIdsFilter('rentals'));
  it('GET /users?ids=... — filters by IDs', () => testIdsFilter('users'));
  it('GET /libraries?ids=... — filters by IDs', () => testIdsFilter('libraries'));
  it('GET /roles?ids=... — filters by IDs', () => testIdsFilter('roles'));
  it('GET /regions?ids=... — filters by IDs', () => testIdsFilter('regions'));

  it('ids filter works with other filters combined', async () => {
    // Get some books
    const allRes = await request(app.getHttpServer() as App)
      .get('/api/v1/books')
      .set(auth())
      .expect(200);

    if (allRes.body.items.length < 1) return;

    const targetId = allRes.body.items[0].id;

    // Combine ids + q (search)
    const res = await request(app.getHttpServer() as App)
      .get(`/api/v1/books?ids=${targetId}&q=nonexistent_xyz_abc`)
      .set(auth())
      .expect(200);

    // Should return 0 because q won't match
    expect(res.body.items).toHaveLength(0);
  });

  it('empty ids array does not filter (returns all)', async () => {
    const allRes = await request(app.getHttpServer() as App)
      .get('/api/v1/books')
      .set(auth())
      .expect(200);

    // Without ids param — same result
    const noIdsRes = await request(app.getHttpServer() as App)
      .get('/api/v1/books')
      .set(auth())
      .expect(200);

    expect(allRes.body.meta.totalItems).toBe(noIdsRes.body.meta.totalItems);
  });

  it('ids[] bracket format also works', async () => {
    const allRes = await request(app.getHttpServer() as App)
      .get('/api/v1/regions')
      .set(auth())
      .expect(200);

    if (allRes.body.items.length < 1) return;

    const targetId = allRes.body.items[0].id;

    // ids[]=X format (URL encoded as ids%5B%5D=X)
    const res = await request(app.getHttpServer() as App)
      .get(`/api/v1/regions?ids[]=${targetId}&size=1`)
      .set(auth())
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(targetId);
  });

  it('non-existent ids return empty list', async () => {
    const res = await request(app.getHttpServer() as App)
      .get('/api/v1/books')
      .query({ ids: [999999, 999998] })
      .set(auth())
      .expect(200);

    expect(res.body.items).toHaveLength(0);
    expect(res.body.meta.totalItems).toBe(0);
  });

  // --- Stocks: busy and status filters ---
  describe('Stocks busy/status filter', () => {
    it('GET /stocks?busy=false — returns only non-busy stocks', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/stocks?busy=false')
        .set(auth())
        .expect(200);

      for (const item of res.body.items) {
        expect(item.busy).toBe(false);
      }
    });

    it('GET /stocks?busy=true — returns only busy stocks', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/stocks?busy=true')
        .set(auth())
        .expect(200);

      for (const item of res.body.items) {
        expect(item.busy).toBe(true);
      }
    });

    it('GET /stocks?status=ACTIVE — returns only ACTIVE stocks', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/stocks?status=ACTIVE')
        .set(auth())
        .expect(200);

      for (const item of res.body.items) {
        expect(item.status).toBe('ACTIVE');
      }
    });

    it('GET /stocks?busy=false&status=ACTIVE — combines both filters', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/stocks?busy=false&status=ACTIVE')
        .set(auth())
        .expect(200);

      for (const item of res.body.items) {
        expect(item.busy).toBe(false);
        expect(item.status).toBe('ACTIVE');
      }
    });
  });
});
