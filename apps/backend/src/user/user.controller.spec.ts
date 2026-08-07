import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app/app.module';
import { PrismaService } from '../prisma/prisma.service';

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('');
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/user/accounts', () => {
    it('returns 200 with an array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/accounts')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('includes plaidItem.institutionName in each account', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/accounts')
        .expect(200);

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('plaidItem');
        expect(res.body[0].plaidItem).toHaveProperty('institutionName');
      }
    });
  });

  describe('GET /api/user/transactions', () => {
    it('returns 200 with an array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/transactions')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('filters by account_id query param', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/transactions?account_id=nonexistent-id')
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('filters by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/transactions?from=2099-01-01&to=2099-12-31')
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('includes account.name and account.plaidItem in each transaction', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/transactions')
        .expect(200);

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('account');
        expect(res.body[0].account).toHaveProperty('name');
        expect(res.body[0].account).toHaveProperty('plaidItem');
      }
    });
  });

  describe('GET /api/user/reports', () => {
    it('returns 200 with an array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/reports')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('reports have expected shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/reports')
        .expect(200);

      if (res.body.length > 0) {
        const report = res.body[0];
        expect(report).toHaveProperty('reportType');
        expect(report).toHaveProperty('period');
        expect(report).toHaveProperty('value');
      }
    });
  });

  describe('POST /api/user/sync', () => {
    it('returns 201 with workflowId when Temporal is available', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user/sync')
        .expect(201);

      expect(res.body).toHaveProperty('workflowId');
      expect(typeof res.body.workflowId).toBe('string');
    });
  });
});
