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
import { RentalService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { RejectRentalDto } from './dto/reject-rental.dto';
import { EditRentalDto } from './dto/edit-rental.dto';
import { QueryRentalDto } from './dto/query-rental.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('rentals')
@ApiBearerAuth()
@Controller('rentals')
@UseInterceptors(AuditLogInterceptor)
export class RentalController {
  constructor(private readonly service: RentalService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.READ_RENTALS)
  @ApiOperation({ summary: 'List rentals (library-scoped)' })
  findAll(@Query() query: QueryRentalDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  @Get('report')
  @RequirePermissions(PERMISSIONS.READ_RENTALS)
  @ApiOperation({ summary: 'Expired rentals report' })
  report(@Query() query: QueryRentalDto, @CurrentUser() user: RequestUser) {
    return this.service.report(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_RENTALS)
  @ApiOperation({ summary: 'Get rental by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, user);
  }

  @Post('check')
  @RequirePermissions(PERMISSIONS.CREATE_RENTALS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pre-validate rental eligibility' })
  check(@Body() dto: CreateRentalDto, @CurrentUser() user: RequestUser) {
    return this.service.check(dto, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_RENTALS)
  @ApiOperation({ summary: 'Create rental' })
  create(@Body() dto: CreateRentalDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_RENTALS)
  @ApiOperation({ summary: 'Edit rental dueDate' })
  edit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditRentalDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.edit(id, dto, user);
  }

  @Patch(':id/return')
  @RequirePermissions(PERMISSIONS.UPDATE_RENTALS)
  @ApiOperation({ summary: 'Return book' })
  returnBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnRentalDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.returnBook(id, dto, user);
  }

  @Patch(':id/reject')
  @RequirePermissions(PERMISSIONS.UPDATE_RENTALS)
  @ApiOperation({ summary: 'Reject rental' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRentalDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.reject(id, dto, user);
  }
}
