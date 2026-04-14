import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegionService } from './regions.service';
import { CreateRegionDto } from './dto/create-regions.dto';
import { UpdateRegionDto } from './dto/update-regions.dto';
import { QueryRegionDto } from './dto/query-regions.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('regions')
@ApiBearerAuth()
@Controller('regions')
@UseInterceptors(AuditLogInterceptor)
export class RegionController {
  constructor(private readonly service: RegionService) {}

  @Get()
  @RequirePermissions(312)
  @ApiOperation({ summary: 'List regions' })
  findAll(@Query() query: QueryRegionDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(312)
  @ApiOperation({ summary: 'Get regions by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(311)
  @ApiOperation({ summary: 'Create regions' })
  create(@Body() dto: CreateRegionDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(313)
  @ApiOperation({ summary: 'Update regions' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.service.update(id, dto);
  }
}
