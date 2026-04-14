import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FrontAuthService } from '../services/front-auth.service';
import { FrontSigninDto } from '../dto/front-signin.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('app/auth')
@Controller('app/auth')
export class FrontAuthController {
  constructor(private service: FrontAuthService) {}

  @Post('signin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Client signin (phone + password/passport)' })
  signin(@Body() dto: FrontSigninDto) {
    return this.service.signin(dto);
  }
}
