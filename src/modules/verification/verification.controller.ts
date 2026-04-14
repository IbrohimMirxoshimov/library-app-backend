import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('verification')
@ApiBearerAuth()
@Controller('verification')
@UseInterceptors(AuditLogInterceptor)
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post('send-code')
  @RequirePermissions(PERMISSIONS.SEND_VERIFICATION)
  @ApiOperation({ summary: 'Send SMS verification code' })
  @ApiResponse({ status: 201, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  sendCode(@Body() dto: SendCodeDto) {
    return this.service.sendCode(dto.phone);
  }

  @Post('verify')
  @RequirePermissions(PERMISSIONS.VERIFY_CODE)
  @ApiOperation({ summary: 'Verify SMS code' })
  @ApiResponse({ status: 201, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  verify(@Body() dto: VerifyCodeDto) {
    return this.service.verifyCode(dto.phone, dto.code);
  }
}
