import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { syncUserAccounts, syncUserTransactions, generateUserReports } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60s',
});

export async function syncBankDataWorkflow(userId: string): Promise<void> {
  await syncUserAccounts(userId);
  await syncUserTransactions(userId);
  await generateUserReports(userId);
}
