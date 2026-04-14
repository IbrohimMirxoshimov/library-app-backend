import { Module } from '@nestjs/common';
import { AddressService } from './addresses.service';

@Module({
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressesModule {}
