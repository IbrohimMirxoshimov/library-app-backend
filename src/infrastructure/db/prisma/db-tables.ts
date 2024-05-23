import { PrismaService } from ".";

export interface DbTables {
  users: unknown;
  stocks: unknown;
  books: unknown;
  rents: unknown;
  authors: unknown;
  locations: unknown;
  booksGroups: unknown; 
  regions: unknown;
  publishers: unknown;
  collections: unknown;
  smsBulk: unknown;
  sms: unknown;
}

export class DbTablesImpl implements DbTables {
  constructor(private readonly prismaService: PrismaService) {}
  
  get users() {
    return this.prismaService.users;
  }

  get stocks() {
    return this.prismaService.stocks;
  }

  get books() {
    return this.prismaService.books;
  }

  get authors() {
    return this.prismaService.authors;
  }

  get booksGroups() {
    return this.prismaService.booksGroups;
  }

  get collections() {
    return this.prismaService.collections;
  }

  get locations() {
    return this.prismaService.locations;
  }

  get publishers() {
    return this.prismaService.publishers;
  }

  get regions() {
    return this.prismaService.regions;
  }

  get rents() {
    return this.prismaService.rents;
  }

  get sms() {
    return this.prismaService.sms;
  }

  get smsBulk() {
    return this.prismaService.smsBulk;
  }
}