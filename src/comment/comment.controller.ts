import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Request } from 'express';
import { CreateCommentDto } from './dto/createCommentDto';
import { AuthGuard } from '@nestjs/passport';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  create(@Req() request: Request, @Body() createCommentDto: CreateCommentDto) {
    const userId = request.user['userId'];
    return this.commentService.create(userId, createCommentDto);
  }
}
