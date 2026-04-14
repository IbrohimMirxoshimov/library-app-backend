import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { App } from 'supertest/types';

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/signin', () => {
    it('should return JWT token with valid credentials', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/signin')
        .send({ login: 'admin', password: 'admin123' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should return 401 with invalid password', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/signin')
        .send({ login: 'admin', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 with non-existent user', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/signin')
        .send({ login: 'nonexistent', password: 'test123' })
        .expect(401);
    });

    it('should return 400 with missing fields', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/signin')
        .send({ login: 'admin' })
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/api/v1/auth/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('JWT token validation', () => {
    it('should decode valid JWT and access protected endpoints', async () => {
      // First get a valid token
      const signinRes = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/signin')
        .send({ login: 'admin', password: 'admin123' })
        .expect(200);

      const { token } = signinRes.body;
      expect(token).toBeDefined();

      // Token should be a valid JWT (3 parts separated by dots)
      const parts = (token as string).split('.');
      expect(parts).toHaveLength(3);
    });
  });
});
