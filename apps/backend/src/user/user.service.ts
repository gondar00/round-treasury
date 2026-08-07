import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from '../temporal/temporal.service';

const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private temporal: TemporalService,
  ) {}

  async getAccounts() {
    return this.prisma.account.findMany({
      where: { userId: DEMO_USER_ID },
      include: { plaidItem: { select: { institutionName: true } } },
      orderBy: { lastSyncedAt: 'desc' },
    });
  }

  async getTransactions(filters: { accountId?: string; from?: string; to?: string }) {
    const where: any = {
      account: { userId: DEMO_USER_ID },
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to);
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { name: true, mask: true, plaidItem: { select: { institutionName: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getReports() {
    return this.prisma.report.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: [{ reportType: 'asc' }, { period: 'desc' }],
    });
  }

  async triggerSync() {
    const handle = await this.temporal.startSyncWorkflow(DEMO_USER_ID);
    if (!handle) {
      return { error: 'Temporal service unavailable' } as const;
    }
    return { workflowId: handle.workflowId };
  }
}
