import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { RedisClientType } from 'redis';
import session from 'express-session';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { seedE2EData, SeededIds } from './helpers/seed';

describe('Permissions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let seededIds: SeededIds;

  const mockRedisClient = createMock<RedisClientType>({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    flushAll: jest.fn().mockResolvedValue('OK'),
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
    seededIds = await seedE2EData(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  async function loginAs(email: string) {
    const agent = request.agent(app.getHttpServer());
    const usersRes = await agent.get('/api/auth/users').expect(200);
    const user = usersRes.body.data.find((u: any) => u.email === email);
    if (!user) throw new Error(`User ${email} not found in seed data`);
    await agent.post('/api/auth/select').send({ userId: user.id }).expect(200);
    return agent;
  }

  describe('RBAC Access Control', () => {
    it('GET /api/users - accessible by all authenticated roles', async () => {
      const agent = await loginAs('viewer@test.com');
      await agent.get('/api/users').expect(200);
    });

    it('POST /api/users - Admin only, Editor forbidden', async () => {
      const editorAgent = await loginAs('editor@test.com');
      await editorAgent
        .post('/api/users')
        .send({ name: 'New', email: 'n@t.com', roleIds: [seededIds.viewerRoleId] })
        .expect(403);

      const adminAgent = await loginAs('admin@test.com');
      await adminAgent
        .post('/api/users')
        .send({ name: 'New', email: 'n@t.com', roleIds: [seededIds.viewerRoleId] })
        .expect(201);
    });

    it('PUT /api/users/:id - Editor allowed, Viewer forbidden', async () => {
      const viewerAgent = await loginAs('viewer@test.com');
      await viewerAgent.put(`/api/users/${seededIds.viewerUserId}`).send({ name: 'Updated' }).expect(403);

      const editorAgent = await loginAs('editor@test.com');
      await editorAgent.put(`/api/users/${seededIds.viewerUserId}`).send({ name: 'Updated' }).expect(200);
    });

    it('DELETE /api/users/:id - Admin only, Editor forbidden', async () => {
      const editorAgent = await loginAs('editor@test.com');
      await editorAgent.delete(`/api/users/${seededIds.toDeleteUserId}`).expect(403);

      const adminAgent = await loginAs('admin@test.com');
      await adminAgent.delete(`/api/users/${seededIds.toDeleteUserId}`).expect(200);
    });
  });

  describe('Roles Access Control', () => {
    it('GET /api/roles - Admin & Editor allowed, Viewer forbidden', async () => {
      const viewerAgent = await loginAs('viewer@test.com');
      await viewerAgent.get('/api/roles').expect(403);

      const editorAgent = await loginAs('editor@test.com');
      await editorAgent.get('/api/roles').expect(200);
    });

    it('PUT /api/roles/:id - Admin only, Editor forbidden', async () => {
      const editorAgent = await loginAs('editor@test.com');
      await editorAgent.put(`/api/roles/${seededIds.viewerRoleId}`).send({ name: 'ViewerUpdated' }).expect(403);

      const adminAgent = await loginAs('admin@test.com');
      await adminAgent.put(`/api/roles/${seededIds.viewerRoleId}`).send({ name: 'ViewerUpdated' }).expect(200);
    });
  });
});
