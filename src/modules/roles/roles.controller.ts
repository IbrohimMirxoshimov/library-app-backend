import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-roles.dto';
import { UpdateRoleDto } from './dto/update-roles.dto';
import { QueryRoleDto } from './dto/query-roles.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseInterceptors(AuditLogInterceptor)
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @RequirePermissions(212)
  @ApiOperation({ summary: 'List roles' })
  findAll(@Query() query: QueryRoleDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(212)
  @ApiOperation({ summary: 'Get roles by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(211)
  @ApiOperation({ summary: 'Create roles' })
  create(@Body() dto: CreateRoleDto, @CurrentUser() _user: RequestUser) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(213)
  @ApiOperation({ summary: 'Update roles' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }
}
