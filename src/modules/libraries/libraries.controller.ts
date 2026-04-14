import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './libraries.service';
import { CreateLibraryDto } from './dto/create-libraries.dto';
import { UpdateLibraryDto } from './dto/update-libraries.dto';
import { QueryLibraryDto } from './dto/query-libraries.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('libraries')
@ApiBearerAuth()
@Controller('libraries')
@UseInterceptors(AuditLogInterceptor)
export class LibraryController {
  constructor(private readonly service: LibraryService) {}

  @Get()
  @RequirePermissions(302)
  @ApiOperation({ summary: 'List libraries' })
  findAll(@Query() query: QueryLibraryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(302)
  @ApiOperation({ summary: 'Get libraries by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(301)
  @ApiOperation({ summary: 'Create libraries' })
  create(@Body() dto: CreateLibraryDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(303)
  @ApiOperation({ summary: 'Update libraries' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLibraryDto) {
    return this.service.update(id, dto);
  }
}
