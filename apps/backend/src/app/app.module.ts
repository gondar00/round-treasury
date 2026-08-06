import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PlaidModule } from '../integrations/plaid/plaid.module';
import { TemporalModule } from '../temporal/temporal.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, PlaidModule, TemporalModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
