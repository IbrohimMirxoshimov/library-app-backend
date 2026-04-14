import { Module } from '@nestjs/common';
import { StockController } from './stocks.controller';
import { StockService } from './stocks.service';

@Module({
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StocksModule {}
