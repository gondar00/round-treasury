import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit {
  private client!: Client;
  private readonly logger = new Logger(TemporalService.name);

  async onModuleInit() {
    try {
      const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        connectTimeout: 3000,
      });
      this.client = new Client({ connection });
      this.logger.log('Connected to Temporal server');
    } catch (error) {
      this.logger.warn('Failed to connect to Temporal server — workflows will not run');
    }
  }

  getClient(): Client {
    return this.client;
  }

  async startSyncWorkflow(userId: string) {
    if (!this.client) {
      this.logger.warn('Temporal client not available, skipping workflow');
      return null;
    }

    const handle = await this.client.workflow.start('syncBankDataWorkflow', {
      taskQueue: 'bank-sync',
      workflowId: `sync-bank-data-user-${userId}`,
      args: [userId],
    });
    return handle;
  }

  async createSyncSchedule(userId: string) {
    if (!this.client) {
      this.logger.warn('Temporal client not available, skipping schedule');
      return null;
    }

    const scheduleId = `sync-schedule-user-${userId}`;

    try {
      const handle = await this.client.schedule.create({
        scheduleId,
        spec: {
          intervals: [{ every: '1h' }],
        },
        action: {
          type: 'startWorkflow',
          workflowType: 'syncBankDataWorkflow',
          taskQueue: 'bank-sync',
          args: [userId],
        },
      });
      this.logger.log(`Created hourly sync schedule: ${scheduleId}`);
      return handle;
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        this.logger.log(`Schedule ${scheduleId} already exists`);
        return null;
      }
      throw error;
    }
  }
}
