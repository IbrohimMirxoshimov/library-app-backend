import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CheckPassportDto } from './dto/check-passport.dto';
import { LinkLibraryDto } from './dto/link-library.dto';
import { CreatePassportDto } from './dto/create-passport.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(AuditLogInterceptor)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.READ_USERS)
  @ApiOperation({ summary: 'List users (library-scoped)' })
  findAll(@Query() query: QueryUserDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_USERS)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_USERS)
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_USERS)
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Post('check-passport')
  @RequirePermissions(PERMISSIONS.CREATE_USERS)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Check passport across libraries (rate limited: 2/min)' })
  checkPassport(@Body() dto: CheckPassportDto, @CurrentUser() user: RequestUser) {
    return this.service.checkPassport(dto.passportId, user);
  }

  @Post('link-library')
  @RequirePermissions(PERMISSIONS.CREATE_USERS)
  @Throttle({ default: { limit: 1, ttl: 120000 } })
  @ApiOperation({ summary: 'Link user to library via hash (rate limited: 1/2min)' })
  linkLibrary(@Body() dto: LinkLibraryDto, @CurrentUser() user: RequestUser) {
    return this.service.linkLibrary(dto.hash, dto.libraryId, user);
  }

  @Post(':userId/passports')
  @RequirePermissions(PERMISSIONS.CREATE_PASSPORTS)
  @ApiOperation({ summary: 'Add new passport to user' })
  createPassport(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreatePassportDto,
  ) {
    return this.service.createPassport({ ...dto, userId });
  }
}
