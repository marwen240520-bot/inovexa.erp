import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
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

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const email = 	est@test.com;
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });
  });

  describe('/finance/invoices (GET)', () => {
    it('should return invoices list', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      const response = await request(app.getHttpServer())
        .get('/finance/invoices')
        .set('Authorization', Bearer )
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
