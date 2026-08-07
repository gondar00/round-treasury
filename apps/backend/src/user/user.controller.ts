import { Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('accounts')
  async getAccounts() {
    return this.userService.getAccounts();
  }

  @Get('transactions')
  async getTransactions(
    @Query('account_id') accountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userService.getTransactions({ accountId, from, to });
  }

  @Get('reports')
  async getReports() {
    return this.userService.getReports();
  }

  @Post('sync')
  async triggerSync() {
    try {
      return await this.userService.triggerSync();
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('already running')) {
        return { error: 'Sync already in progress' };
      }
      throw error;
    }
  }
}
