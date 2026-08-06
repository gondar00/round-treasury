import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit {
  private client: Client;

  async onModuleInit() {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });
    this.client = new Client({ connection });
  }

  getClient(): Client {
    return this.client;
  }

  async startSyncWorkflow(userId: string) {
    const handle = await this.client.workflow.start('syncBankDataWorkflow', {
      taskQueue: 'bank-sync',
      workflowId: `sync-bank-data-user-${userId}`,
      args: [userId],
    });
    return handle;
  }
}
