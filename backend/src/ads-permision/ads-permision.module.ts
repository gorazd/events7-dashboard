import { Module } from '@nestjs/common';
import { AdsPermissionService } from './ads-permision.service';
import { AdsPermissionController } from './ads-permision.controller';

@Module({
  controllers: [AdsPermissionController],
  providers: [AdsPermissionService],
})
export class AdsPermissionModule {}
