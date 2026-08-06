import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ReportType } from '@prisma/client';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function createPlaidClient(): PlaidApi {
  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(configuration);
}

export async function syncUserAccounts(userId: string): Promise<void> {
  const plaidClient = createPlaidClient();
  const plaidItems = await prisma.plaidItem.findMany({ where: { userId } });

  for (const item of plaidItems) {
    const response = await plaidClient.accountsGet({
      access_token: item.accessToken,
    });

    for (const plaidAccount of response.data.accounts) {
      await prisma.account.upsert({
        where: { plaidAccountId: plaidAccount.account_id },
        update: {
          name: plaidAccount.name,
          officialName: plaidAccount.official_name || null,
          type: plaidAccount.type,
          subtype: plaidAccount.subtype || null,
          mask: plaidAccount.mask || null,
          currentBalance: plaidAccount.balances.current,
          availableBalance: plaidAccount.balances.available,
          currency: plaidAccount.balances.iso_currency_code || 'GBP',
          lastSyncedAt: new Date(),
        },
        create: {
          userId,
          plaidItemId: item.id,
          plaidAccountId: plaidAccount.account_id,
          name: plaidAccount.name,
          officialName: plaidAccount.official_name || null,
          type: plaidAccount.type,
          subtype: plaidAccount.subtype || null,
          mask: plaidAccount.mask || null,
          currentBalance: plaidAccount.balances.current,
          availableBalance: plaidAccount.balances.available,
          currency: plaidAccount.balances.iso_currency_code || 'GBP',
          lastSyncedAt: new Date(),
        },
      });
    }
  }
}

export async function syncUserTransactions(userId: string): Promise<void> {
  const plaidClient = createPlaidClient();
  const plaidItems = await prisma.plaidItem.findMany({ where: { userId } });

  for (const item of plaidItems) {
    let cursor = item.cursor || undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: item.accessToken,
        cursor: cursor,
      });

      const { added, modified, removed, next_cursor, has_more } = response.data;

      // Handle added transactions
      for (const tx of added) {
        const account = await prisma.account.findUnique({
          where: { plaidAccountId: tx.account_id },
        });
        if (!account) continue;

        await prisma.transaction.upsert({
          where: { plaidTransactionId: tx.transaction_id },
          update: {
            amount: tx.amount,
            currency: tx.iso_currency_code || 'GBP',
            date: new Date(tx.date),
            name: tx.name,
            merchantName: tx.merchant_name || null,
            category: tx.personal_finance_category?.primary || null,
            paymentChannel: tx.payment_channel || null,
            pending: tx.pending,
          },
          create: {
            accountId: account.id,
            plaidTransactionId: tx.transaction_id,
            amount: tx.amount,
            currency: tx.iso_currency_code || 'GBP',
            date: new Date(tx.date),
            name: tx.name,
            merchantName: tx.merchant_name || null,
            category: tx.personal_finance_category?.primary || null,
            paymentChannel: tx.payment_channel || null,
            pending: tx.pending,
          },
        });
      }

      // Handle modified transactions
      for (const tx of modified) {
        await prisma.transaction.updateMany({
          where: { plaidTransactionId: tx.transaction_id },
          data: {
            amount: tx.amount,
            currency: tx.iso_currency_code || 'GBP',
            date: new Date(tx.date),
            name: tx.name,
            merchantName: tx.merchant_name || null,
            category: tx.personal_finance_category?.primary || null,
            paymentChannel: tx.payment_channel || null,
            pending: tx.pending,
          },
        });
      }

      // Handle removed transactions
      for (const tx of removed) {
        if (tx.transaction_id) {
          await prisma.transaction.deleteMany({
            where: { plaidTransactionId: tx.transaction_id },
          });
        }
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update cursor on the plaid item
    await prisma.plaidItem.update({
      where: { id: item.id },
      data: { cursor },
    });
  }
}

export async function generateUserReports(userId: string): Promise<void> {
  const accounts = await prisma.account.findMany({ where: { userId } });
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const currency = accounts[0]?.currency || 'GBP';

  const earliestTx = await prisma.transaction.findFirst({
    where: { account: { userId }, pending: false },
    orderBy: { date: 'asc' },
  });

  if (!earliestTx) return;

  const now = new Date();
  const lastCompletedMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startMonth = new Date(earliestTx.date.getFullYear(), earliestTx.date.getMonth(), 1);

  if (startMonth > lastCompletedMonth) return;

  const months: Date[] = [];
  const cursor = new Date(startMonth);
  while (cursor <= lastCompletedMonth) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const monthlyData: { period: Date; spend: number; income: number }[] = [];

  for (const month of months) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const transactions = await prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: month, lt: nextMonth },
        pending: false,
      },
    });

    const spend = transactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const income = transactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    monthlyData.push({ period: month, spend, income });
  }

  for (let i = 0; i < monthlyData.length; i++) {
    const { period, spend, income } = monthlyData[i];
    const prev = i > 0 ? monthlyData[i - 1] : null;

    const spendChange = prev && prev.spend > 0
      ? Math.round(((spend - prev.spend) / prev.spend) * 100 * 100) / 100
      : null;

    const incomeChange = prev && prev.income > 0
      ? Math.round(((income - prev.income) / prev.income) * 100 * 100) / 100
      : null;

    await prisma.report.upsert({
      where: { userId_reportType_period: { userId, reportType: ReportType.monthly_spend, period } },
      update: { value: spend, changePercentage: spendChange, currency },
      create: { userId, reportType: ReportType.monthly_spend, period, value: spend, changePercentage: spendChange, currency },
    });

    await prisma.report.upsert({
      where: { userId_reportType_period: { userId, reportType: ReportType.monthly_income, period } },
      update: { value: income, changePercentage: incomeChange, currency },
      create: { userId, reportType: ReportType.monthly_income, period, value: income, changePercentage: incomeChange, currency },
    });

    const avgNetBurn = monthlyData.slice(0, i + 1).reduce((sum, m) => sum + (m.spend - m.income), 0) / (i + 1);
    let runwayMonths = 0;
    let cashZeroDate: Date | null = null;

    if (avgNetBurn > 0 && totalBalance > 0) {
      runwayMonths = Math.round(totalBalance / avgNetBurn);
      cashZeroDate = new Date(now);
      cashZeroDate.setMonth(cashZeroDate.getMonth() + runwayMonths);
    }

    await prisma.report.upsert({
      where: { userId_reportType_period: { userId, reportType: ReportType.runway, period } },
      update: { value: runwayMonths, unit: 'months', cashZeroDate, currency: null },
      create: { userId, reportType: ReportType.runway, period, value: runwayMonths, unit: 'months', cashZeroDate, currency: null },
    });
  }
}
