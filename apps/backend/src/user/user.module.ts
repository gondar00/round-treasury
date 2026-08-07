import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TemporalModule } from '../temporal/temporal.module';

@Module({
  imports: [TemporalModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
