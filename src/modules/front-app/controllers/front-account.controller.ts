import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrontAccountService } from '../services/front-account.service';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequestUser } from '../../../common/interfaces/request-user.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('app/account')
@ApiBearerAuth()
@Controller('app/account')
export class FrontAccountController {
  constructor(private service: FrontAccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.service.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile' })
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateAccountDto) {
    return this.service.updateProfile(user.id, dto);
  }

  @Get('books')
  @ApiOperation({ summary: 'My rented books' })
  getMyBooks(@CurrentUser() user: RequestUser, @Query() query: PaginationQueryDto) {
    return this.service.getMyBooks(user.id, query);
  }
}
