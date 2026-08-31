import { Module } from '@nestjs/common';
import { DollarRateController } from './dollar-rate.controller';
import { DollarRateService } from './dollar-rate.service';

@Module({
  controllers: [DollarRateController],
  providers: [DollarRateService],
  exports: [DollarRateService],
})
export class DollarRateModule {}
