import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

@Controller('api/user')
export class UserController {
  constructor(private prisma: PrismaService) {}

  @Get('accounts')
  async getAccounts() {
    return this.prisma.account.findMany({
      where: { userId: DEMO_USER_ID },
      include: { plaidItem: { select: { institutionName: true } } },
      orderBy: { lastSyncedAt: 'desc' },
    });
  }

  @Get('transactions')
  async getTransactions(
    @Query('account_id') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const where: any = {
      account: { userId: DEMO_USER_ID },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { name: true, mask: true, plaidItem: { select: { institutionName: true } } },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  @Get('reports')
  async getReports() {
    return this.prisma.report.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: [{ reportType: 'asc' }, { period: 'desc' }],
    });
  }
}
