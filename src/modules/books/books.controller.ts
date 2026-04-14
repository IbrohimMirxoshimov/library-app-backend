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
import { BookService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { PERMISSIONS } from '../../constants/permissions';

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
@UseInterceptors(AuditLogInterceptor)
export class BookController {
  constructor(private readonly service: BookService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.READ_BOOKS)
  @ApiOperation({ summary: 'List books' })
  findAll(@Query() query: QueryBookDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.READ_BOOKS)
  @ApiOperation({ summary: 'Get book by ID (includes BookRule for user library)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CREATE_BOOKS)
  @ApiOperation({ summary: 'Create book (+ BookRule if user has library)' })
  create(@Body() dto: CreateBookDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.UPDATE_BOOKS)
  @ApiOperation({ summary: 'Update book (+ BookRule if user has library)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user);
  }
}
