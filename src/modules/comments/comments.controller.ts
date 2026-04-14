import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for entity' })
  findAll(@Query() query: QueryCommentDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Add comment to stock or rental' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user.id);
  }
}
