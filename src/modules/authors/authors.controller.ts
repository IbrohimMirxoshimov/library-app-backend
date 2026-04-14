import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthorService } from './authors.service';
import { CreateAuthorDto } from './dto/create-authors.dto';
import { UpdateAuthorDto } from './dto/update-authors.dto';
import { QueryAuthorDto } from './dto/query-authors.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('authors')
@ApiBearerAuth()
@Controller('authors')
@UseInterceptors(AuditLogInterceptor)
export class AuthorController {
  constructor(private readonly service: AuthorService) {}

  @Get()
  @RequirePermissions(12)
  @ApiOperation({ summary: 'List authors' })
  findAll(@Query() query: QueryAuthorDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(12)
  @ApiOperation({ summary: 'Get authors by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(11)
  @ApiOperation({ summary: 'Create authors' })
  create(@Body() dto: CreateAuthorDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(13)
  @ApiOperation({ summary: 'Update authors' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuthorDto) {
    return this.service.update(id, dto);
  }
}
