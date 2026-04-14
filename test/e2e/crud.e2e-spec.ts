import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { App } from 'supertest/types';

describe('Phase 2 CRUD (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const uid = Date.now().toString(36); // Unique suffix for test data

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

    // Get auth token
    const res = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/signin')
      .send({ login: 'admin', password: 'admin123' });
    token = res.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // --- Roles ---
  describe('Roles CRUD', () => {
    let roleId: number;

    it('POST /roles — create role', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/roles')
        .set(auth())
        .send({ name: `test-role-${uid}`, permissions: [1, 2] })
        .expect(201);
      roleId = res.body.id;
      expect(res.body.name).toBe(`test-role-${uid}`);
    });

    it('GET /roles — list roles', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/roles')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.meta).toBeDefined();
    });

    it('GET /roles/:id — get role', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/roles/${roleId}`)
        .set(auth())
        .expect(200);
      expect(res.body.name).toBe(`test-role-${uid}`);
    });

    it('PATCH /roles/:id — update role', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/roles/${roleId}`)
        .set(auth())
        .send({ description: 'Test role description' })
        .expect(200);
      expect(res.body.description).toBe('Test role description');
    });
  });

  // --- Regions ---
  describe('Regions CRUD', () => {
    let regionId: number;

    it('POST /regions — create region', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/regions')
        .set(auth())
        .send({ name: `Test viloyat ${uid}` })
        .expect(201);
      regionId = res.body.id;
      expect(res.body.name).toBe(`Test viloyat ${uid}`);
    });

    it('GET /regions — list regions', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/regions')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('POST /regions — create child region', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/regions')
        .set(auth())
        .send({ name: `Test tuman ${uid}`, parentId: regionId })
        .expect(201);
      expect(res.body.parentId).toBe(regionId);
    });
  });

  // --- Libraries ---
  describe('Libraries CRUD', () => {
    let libraryId: number;

    it('POST /libraries — create library', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/libraries')
        .set(auth())
        .send({ name: `Test kutubxona ${uid}`, active: true })
        .expect(201);
      libraryId = res.body.id;
      expect(res.body.name).toBe(`Test kutubxona ${uid}`);
    });

    it('GET /libraries — list libraries', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/libraries')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('PATCH /libraries/:id — update library', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/libraries/${libraryId}`)
        .set(auth())
        .send({ description: 'Test description' })
        .expect(200);
      expect(res.body.description).toBe('Test description');
    });
  });

  // --- Authors ---
  describe('Authors CRUD', () => {
    let authorId: number;

    it('POST /authors — create author', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/authors')
        .set(auth())
        .send({ name: `Alisher Navoiy ${uid}` })
        .expect(201);
      authorId = res.body.id;
      expect(res.body.name).toBe(`Alisher Navoiy ${uid}`);
    });

    it('GET /authors?q=navoiy — search authors', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/authors?q=navoiy')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('PATCH /authors/:id — update', async () => {
      await request(app.getHttpServer() as App)
        .patch(`/api/v1/authors/${authorId}`)
        .set(auth())
        .send({ images: ['/uploads/authors/navoiy.jpg'] })
        .expect(200);
    });
  });

  // --- Publishers ---
  describe('Publishers CRUD', () => {
    it('POST /publishers — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/publishers')
        .set(auth())
        .send({ name: `Sharq nashriyoti ${uid}` })
        .expect(201);
      expect(res.body.name).toBe(`Sharq nashriyoti ${uid}`);
    });
  });

  // --- Collections ---
  describe('Collections CRUD', () => {
    it('POST /collections — create', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/collections')
        .set(auth())
        .send({ name: `Badiiy adabiyot ${uid}`, sort: 1 })
        .expect(201);
      expect(res.body.name).toBe(`Badiiy adabiyot ${uid}`);
    });
  });

  // --- Books ---
  describe('Books CRUD', () => {
    let bookId: number;

    it('POST /books — create book with authors', async () => {
      // First get the author ID
      const authorsRes = await request(app.getHttpServer() as App)
        .get('/api/v1/authors')
        .set(auth());
      const authorId = authorsRes.body.items[0]?.id;

      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/books')
        .set(auth())
        .send({
          name: `Mehrobdan chayon ${uid}`,
          language: 'UZ',
          authorIds: authorId ? [authorId] : [],
          bookRule: { price: 50000, rentDuration: 15 },
        })
        .expect(201);
      bookId = res.body.id;
      expect(res.body.name).toBe(`Mehrobdan chayon ${uid}`);
      expect(res.body.searchableName).toBeDefined();
    });

    it('GET /books?q=mehrobdan — search books', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/books?q=mehrobdan')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('GET /books/:id — get book detail', async () => {
      const res = await request(app.getHttpServer() as App)
        .get(`/api/v1/books/${bookId}`)
        .set(auth())
        .expect(200);
      expect(res.body.authors.length).toBeGreaterThan(0);
    });

    it('PATCH /books/:id — update book', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/books/${bookId}`)
        .set(auth())
        .send({ description: 'Abdulla Qodiriy romani' })
        .expect(200);
      expect(res.body.description).toBe('Abdulla Qodiriy romani');
    });
  });

  // --- Users ---
  describe('Users CRUD', () => {
    let userId: number;

    it('POST /users — create user', async () => {
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/users')
        .set(auth())
        .send({
          firstName: 'Test',
          lastName: 'User',
          phone: `90${uid.slice(0, 7)}`,
          gender: 'MALE',
          passport: { passportId: `TS${uid}` },
        })
        .expect(201);
      userId = res.body.id;
      expect(res.body.firstName).toBe('Test');
    });

    it('GET /users — list users', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/users')
        .set(auth())
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      // Password should not be in response
      expect(res.body.items[0].password).toBeUndefined();
    });

    it('PATCH /users/:id — update user', async () => {
      const res = await request(app.getHttpServer() as App)
        .patch(`/api/v1/users/${userId}`)
        .set(auth())
        .send({ verified: true })
        .expect(200);
      expect(res.body.verified).toBe(true);
    });
  });

  // --- Passports (under users) ---
  describe('User Passports', () => {
    it('POST /users/:userId/passports — add passport', async () => {
      // Get the test user
      const usersRes = await request(app.getHttpServer() as App)
        .get('/api/v1/users?q=Test')
        .set(auth());
      const userId = usersRes.body.items[0]?.id;

      if (userId) {
        const res = await request(app.getHttpServer() as App)
          .post(`/api/v1/users/${userId}/passports`)
          .set(auth())
          .send({ passportId: `AA${uid}` })
          .expect(201);
        expect(res.body.passportId).toBe(`AA${uid}`.toUpperCase());
      }
    });
  });

  // --- Audit Log ---
  describe('Audit Log', () => {
    it('GET /audit-log — list logs (should have entries from above operations)', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/audit-log')
        .set(auth())
        .expect(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.meta).toBeDefined();
    });
  });
});
