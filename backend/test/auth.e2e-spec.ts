import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { RedisClientType } from 'redis';
import session from 'express-session';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { seedE2EData } from './helpers/seed';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let agent: ReturnType<typeof request.agent>;

  const mockRedisClient = createMock<RedisClientType>({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('REDIS_CLIENT')
      .useValue(mockRedisClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.use(
      session({
        secret: 'test_secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, sameSite: 'strict' },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await seedE2EData(dataSource);
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('/api/auth/users (GET) - should return seeded users', async () => {
    const response = await agent.get('/api/auth/users').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(4); // admin, editor, viewer, toDelete
    expect(response.body.data.map((u: any) => u.email)).toContain('admin@test.com');
  });

  it('/api/auth/select (POST) - should login as admin', async () => {
    const users = await agent.get('/api/auth/users');
    const admin = users.body.data.find((u: any) => u.email === 'admin@test.com');

    const response = await agent
      .post('/api/auth/select')
      .send({ userId: admin.id })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('admin@test.com');
    expect(response.body.data.roles).toContain('Admin');
    expect(response.body.data.permissions).toContain('user.view');
    expect(response.body.data.permissions).toContain('user.delete');
  });

  it('/api/auth/me (GET) - should work after login', async () => {
    const response = await agent.get('/api/auth/me').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('admin@test.com');
  });

  it('/api/auth/logout (POST) - should logout and clear session', async () => {
    await agent.post('/api/auth/logout').expect(200);
    const response = await agent.get('/api/auth/me').expect(401);
    expect(response.body.success).toBe(false);
  });
});
