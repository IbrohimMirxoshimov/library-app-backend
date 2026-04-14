import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collections.dto';
import { UpdateCollectionDto } from './dto/update-collections.dto';
import { QueryCollectionDto } from './dto/query-collections.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('collections')
@ApiBearerAuth()
@Controller('collections')
@UseInterceptors(AuditLogInterceptor)
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  @Get()
  @RequirePermissions(22)
  @ApiOperation({ summary: 'List collections' })
  findAll(@Query() query: QueryCollectionDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(22)
  @ApiOperation({ summary: 'Get collections by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(21)
  @ApiOperation({ summary: 'Create collections' })
  create(@Body() dto: CreateCollectionDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(23)
  @ApiOperation({ summary: 'Update collections' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCollectionDto) {
    return this.service.update(id, dto);
  }
}
