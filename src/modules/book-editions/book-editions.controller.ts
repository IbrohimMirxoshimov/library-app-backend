import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookEditionService } from './book-editions.service';
import { CreateBookEditionDto } from './dto/create-book-editions.dto';
import { UpdateBookEditionDto } from './dto/update-book-editions.dto';
import { QueryBookEditionDto } from './dto/query-book-editions.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('book-editions')
@ApiBearerAuth()
@Controller('book-editions')
@UseInterceptors(AuditLogInterceptor)
export class BookEditionController {
  constructor(private readonly service: BookEditionService) {}

  @Get()
  @RequirePermissions(42)
  @ApiOperation({ summary: 'List book-editions' })
  findAll(@Query() query: QueryBookEditionDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(42)
  @ApiOperation({ summary: 'Get book editions by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(41)
  @ApiOperation({ summary: 'Create book editions' })
  create(@Body() dto: CreateBookEditionDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(43)
  @ApiOperation({ summary: 'Update book editions' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookEditionDto) {
    return this.service.update(id, dto);
  }
}
