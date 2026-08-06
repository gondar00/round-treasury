import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TemporalModule } from '../temporal/temporal.module';

@Module({
  imports: [TemporalModule],
  controllers: [UserController],
})
export class UserModule {}
