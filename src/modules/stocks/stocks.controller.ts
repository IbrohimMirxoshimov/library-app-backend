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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stocks.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { QueryStockDto } from './dto/query-stock.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('stocks')
@ApiBearerAuth()
@Controller('stocks')
@UseInterceptors(AuditLogInterceptor)
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.READ_STOCKS)
  @ApiOperation({ summary: 'List stocks (library-scoped)' })
  findAll(@Query() query: QueryStockDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_STOCKS)
  @ApiOperation({ summary: 'Get stock by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_STOCKS)
  @ApiOperation({ summary: 'Create stock (auto-assigns BookRule)' })
  create(@Body() dto: CreateStockDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_STOCKS)
  @ApiOperation({ summary: 'Update stock' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockDto, @CurrentUser() user: RequestUser) {
    return this.service.update(id, dto, user);
  }
}
