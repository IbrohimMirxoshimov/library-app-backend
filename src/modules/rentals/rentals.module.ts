import { Module } from '@nestjs/common';
import { RentalController } from './rentals.controller';
import { RentalService } from './rentals.service';

@Module({
  controllers: [RentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalsModule {}
