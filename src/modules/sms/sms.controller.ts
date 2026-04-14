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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { CreateSmsDto } from './dto/create-sms.dto';
import { QuerySmsDto } from './dto/query-sms.dto';
import { BulkSmsDto } from './dto/bulk-sms.dto';
import { UpdateSmsDto } from './dto/update-sms.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('sms')
@ApiBearerAuth()
@Controller('sms')
@UseInterceptors(AuditLogInterceptor)
export class SmsController {
  constructor(private readonly service: SmsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.READ_SMS)
  @ApiOperation({ summary: 'List SMS messages' })
  @ApiResponse({ status: 200, description: 'Paginated list of SMS messages' })
  findAll(@Query() query: QuerySmsDto) {
    return this.service.findAll(query);
  }

  @Get('conversations')
  @RequirePermissions(PERMISSIONS.READ_SMS)
  @ApiOperation({ summary: 'List SMS conversations (latest per phone)' })
  @ApiResponse({ status: 200, description: 'Paginated list of conversations' })
  getConversations(@Query() query: QuerySmsDto) {
    return this.service.getConversations(query);
  }

  @Get('conversations/:phone')
  @RequirePermissions(PERMISSIONS.READ_SMS)
  @ApiOperation({ summary: 'Get conversation by phone number' })
  @ApiResponse({ status: 200, description: 'Paginated SMS thread for a phone number' })
  getConversationByPhone(@Param('phone') phone: string, @Query() query: QuerySmsDto) {
    return this.service.getConversationByPhone(phone, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_SMS)
  @ApiOperation({ summary: 'Get SMS by ID' })
  @ApiResponse({ status: 200, description: 'SMS details' })
  @ApiResponse({ status: 404, description: 'SMS not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_SMS)
  @ApiOperation({ summary: 'Create bulk SMS' })
  @ApiResponse({ status: 201, description: 'Bulk SMS created' })
  createBulk(@Body() dto: BulkSmsDto, @CurrentUser() user: RequestUser) {
    return this.service.createBulk(dto, user.id);
  }

  @Post('send-single')
  @RequirePermissions(PERMISSIONS.CREATE_SMS)
  @ApiOperation({ summary: 'Send single SMS' })
  @ApiResponse({ status: 201, description: 'SMS created' })
  sendSingle(@Body() dto: CreateSmsDto) {
    return this.service.sendSingle(dto);
  }

  @Patch('bulk-status')
  @RequirePermissions(PERMISSIONS.UPDATE_SMS)
  @ApiOperation({ summary: 'Bulk update SMS statuses' })
  @ApiResponse({ status: 200, description: 'SMS statuses updated' })
  bulkStatusUpdate(@Body() dto: BulkStatusUpdateDto) {
    return this.service.bulkStatusUpdate(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_SMS)
  @ApiOperation({ summary: 'Update SMS status' })
  @ApiResponse({ status: 200, description: 'SMS updated' })
  @ApiResponse({ status: 404, description: 'SMS not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSmsDto) {
    return this.service.update(id, dto);
  }
}
