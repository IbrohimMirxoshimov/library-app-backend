import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FrontStatsService } from '../services/front-stats.service';
import { StatsByRangeDto } from '../dto/stats-by-range.dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('app/stats')
@Controller('app/stats')
@Public()
export class FrontStatsController {
  constructor(private service: FrontStatsService) {}

  @Get()
  @ApiOperation({ summary: 'Public statistics (cached)' })
  getStats() {
    return this.service.getPublicStats();
  }

  @Post('by-range')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stats by date range' })
  getByRange(@Body() dto: StatsByRangeDto) {
    return this.service.getStatsByRange(dto.startDate, dto.endDate);
  }
}
