import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublisherService } from './publishers.service';
import { CreatePublisherDto } from './dto/create-publishers.dto';
import { UpdatePublisherDto } from './dto/update-publishers.dto';
import { QueryPublisherDto } from './dto/query-publishers.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('publishers')
@ApiBearerAuth()
@Controller('publishers')
@UseInterceptors(AuditLogInterceptor)
export class PublisherController {
  constructor(private readonly service: PublisherService) {}

  @Get()
  @RequirePermissions(32)
  @ApiOperation({ summary: 'List publishers' })
  findAll(@Query() query: QueryPublisherDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(32)
  @ApiOperation({ summary: 'Get publishers by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(31)
  @ApiOperation({ summary: 'Create publishers' })
  create(@Body() dto: CreatePublisherDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(33)
  @ApiOperation({ summary: 'Update publishers' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePublisherDto) {
    return this.service.update(id, dto);
  }
}
