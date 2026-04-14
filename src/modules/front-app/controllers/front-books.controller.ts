import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FrontBooksService } from '../services/front-books.service';
import { Public } from '../../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@ApiTags('app/books')
@Controller('app/books')
@Public()
export class FrontBooksController {
  constructor(private service: FrontBooksService) {}

  @Get()
  @ApiOperation({ summary: 'Browse books (public)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get filter data (collections, authors)' })
  getFilters() {
    return this.service.getFilters();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Book detail with availability' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/statuses')
  @ApiOperation({ summary: 'Book rental statuses at libraries' })
  getStatuses(@Param('id', ParseIntPipe) id: number) {
    return this.service.getStatuses(id);
  }
}
