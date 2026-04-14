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
import { GatewayService } from './gateway.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ReceiveSmsDto } from './dto/receive-sms.dto';
import { UpdateSmsStatusDto } from './dto/update-sms-status.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('gateway')
@ApiBearerAuth()
@Controller('gateway')
@UseInterceptors(AuditLogInterceptor)
export class GatewayController {
  constructor(private readonly service: GatewayService) {}

  @Post('devices')
  @RequirePermissions(PERMISSIONS.CREATE_GATEWAY)
  @ApiOperation({ summary: 'Register Android device for SMS gateway' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  registerDevice(@Body() dto: RegisterDeviceDto, @CurrentUser() user: RequestUser) {
    return this.service.registerDevice(dto, user);
  }

  @Patch('devices/:id')
  @RequirePermissions(PERMISSIONS.UPDATE_GATEWAY)
  @ApiOperation({ summary: 'Update device info' })
  @ApiResponse({ status: 200, description: 'Device updated' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  updateDevice(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeviceDto) {
    return this.service.updateDevice(id, dto);
  }

  @Post('devices/:id/receive-sms')
  @RequirePermissions(PERMISSIONS.CREATE_GATEWAY)
  @ApiOperation({ summary: 'Record incoming SMS received by gateway device' })
  @ApiResponse({ status: 201, description: 'SMS recorded' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  receiveSms(@Param('id', ParseIntPipe) id: number, @Body() dto: ReceiveSmsDto) {
    return this.service.receiveSms(id, dto);
  }

  @Get('devices/:id/pending-sms')
  @RequirePermissions(PERMISSIONS.READ_GATEWAY)
  @ApiOperation({ summary: 'Get pending SMS for a device' })
  @ApiResponse({ status: 200, description: 'Paginated list of pending SMS' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  getPendingSms(@Param('id', ParseIntPipe) id: number, @Query() query: PaginationQueryDto) {
    return this.service.getPendingSms(id, query);
  }

  @Patch('devices/:id/sms-status')
  @RequirePermissions(PERMISSIONS.UPDATE_GATEWAY)
  @ApiOperation({ summary: 'Update SMS delivery status from device' })
  @ApiResponse({ status: 200, description: 'SMS status updated' })
  @ApiResponse({ status: 400, description: 'SMS not found or not owned by device' })
  updateSmsStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSmsStatusDto) {
    return this.service.updateSmsStatus(id, dto);
  }
}
