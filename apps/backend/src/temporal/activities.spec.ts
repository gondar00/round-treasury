import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { generateUserReports } from './activities';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gandharv@localhost:5432/round_treasury';

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_PLAID_ITEM_ID = '00000000-0000-0000-0000-000000000002';
const TEST_ACCOUNT_ID = '00000000-0000-0000-0000-000000000003';

describe('generateUserReports', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  async function cleanupTestData() {
    await prisma.report.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.transaction.deleteMany({ where: { account: { userId: TEST_USER_ID } } });
    await prisma.account.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.plaidItem.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
  }

  async function seedTestData(transactions: { amount: number; date: Date }[]) {
    await prisma.user.create({
      data: { id: TEST_USER_ID, email: 'test-reports@example.com' },
    });

    await prisma.plaidItem.create({
      data: {
        id: TEST_PLAID_ITEM_ID,
        userId: TEST_USER_ID,
        accessToken: 'test-access-token',
        itemId: 'test-item-id-reports',
        institutionName: 'Test Bank',
      },
    });

    await prisma.account.create({
      data: {
        id: TEST_ACCOUNT_ID,
        userId: TEST_USER_ID,
        plaidItemId: TEST_PLAID_ITEM_ID,
        plaidAccountId: 'test-plaid-account-reports',
        name: 'Test Current Account',
        type: 'depository',
        currentBalance: 10000,
        currency: 'GBP',
        lastSyncedAt: new Date(),
      },
    });

    for (let i = 0; i < transactions.length; i++) {
      await prisma.transaction.create({
        data: {
          accountId: TEST_ACCOUNT_ID,
          plaidTransactionId: `test-tx-reports-${i}`,
          amount: transactions[i].amount,
          currency: 'GBP',
          date: transactions[i].date,
          name: `Test Transaction ${i}`,
          pending: false,
        },
      });
    }
  }

  it('produces no reports when there are no transactions', async () => {
    await seedTestData([]);

    await generateUserReports(TEST_USER_ID);

    const reports = await prisma.report.findMany({ where: { userId: TEST_USER_ID } });
    expect(reports).toHaveLength(0);
  });

  it('produces no reports when all transactions are in the current month', async () => {
    const now = new Date();
    await seedTestData([
      { amount: 50, date: new Date(now.getFullYear(), now.getMonth(), 5) },
    ]);

    await generateUserReports(TEST_USER_ID);

    const reports = await prisma.report.findMany({ where: { userId: TEST_USER_ID } });
    expect(reports).toHaveLength(0);
  });

  it('generates reports for a single completed month', async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

    await seedTestData([
      { amount: 100, date: lastMonth },
      { amount: 200, date: lastMonth },
      { amount: -50, date: lastMonth },
    ]);

    await generateUserReports(TEST_USER_ID);

    const reports = await prisma.report.findMany({
      where: { userId: TEST_USER_ID },
      orderBy: { reportType: 'asc' },
    });

    expect(reports).toHaveLength(3);

    const income = reports.find((r) => r.reportType === 'monthly_income');
    const spend = reports.find((r) => r.reportType === 'monthly_spend');
    const runway = reports.find((r) => r.reportType === 'runway');

    expect(spend!.value).toBe(300);
    expect(income!.value).toBe(50);
    expect(runway!.unit).toBe('months');
    expect(runway!.currency).toBeNull();
    expect(spend!.currency).toBe('GBP');
    expect(spend!.changePercentage).toBeNull();
  });

  it('generates reports for multiple months with correct change percentage', async () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    await seedTestData([
      { amount: 100, date: twoMonthsAgo },
      { amount: 200, date: lastMonth },
    ]);

    await generateUserReports(TEST_USER_ID);

    const reports = await prisma.report.findMany({
      where: { userId: TEST_USER_ID, reportType: 'monthly_spend' },
      orderBy: { period: 'asc' },
    });

    expect(reports).toHaveLength(2);
    expect(reports[0].value).toBe(100);
    expect(reports[0].changePercentage).toBeNull();
    expect(reports[1].value).toBe(200);
    expect(reports[1].changePercentage).toBe(100);
  });

  it('calculates runway using cumulative average burn', async () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

    await seedTestData([
      { amount: 1000, date: twoMonthsAgo },
      { amount: -200, date: twoMonthsAgo },
      { amount: 500, date: lastMonth },
      { amount: -100, date: lastMonth },
    ]);

    await generateUserReports(TEST_USER_ID);

    const runwayReports = await prisma.report.findMany({
      where: { userId: TEST_USER_ID, reportType: 'runway' },
      orderBy: { period: 'asc' },
    });

    expect(runwayReports).toHaveLength(2);

    // Month 1: netBurn = 1000-200 = 800, avg = 800/1, runway = 10000/800 = 13 (rounded)
    expect(runwayReports[0].value).toBe(Math.round(10000 / 800));

    // Month 2: netBurn = 500-100 = 400, avg = (800+400)/2 = 600, runway = 10000/600 = 17 (rounded)
    expect(runwayReports[1].value).toBe(Math.round(10000 / 600));
  });

  it('is idempotent — running twice produces the same reports', async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

    await seedTestData([
      { amount: 500, date: lastMonth },
    ]);

    await generateUserReports(TEST_USER_ID);
    await generateUserReports(TEST_USER_ID);

    const reports = await prisma.report.findMany({ where: { userId: TEST_USER_ID } });
    expect(reports).toHaveLength(3);
  });
});
