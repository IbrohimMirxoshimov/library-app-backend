import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    countryCode?: string;
    addressLine?: string;
    street?: string;
    home?: string;
    latitude?: number;
    longitude?: number;
    regionId?: number;
  }) {
    return this.prisma.address.create({ data });
  }

  async update(
    id: number,
    data: {
      addressLine?: string;
      street?: string;
      home?: string;
      latitude?: number;
      longitude?: number;
      regionId?: number;
    },
  ) {
    return this.prisma.address.update({ where: { id }, data });
  }

  async findOne(id: number) {
    return this.prisma.address.findUnique({
      where: { id },
      include: { region: true },
    });
  }
}
