import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/createCommentDto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(userId: number, createCommentDto: CreateCommentDto) {
    const { postId, content } = createCommentDto;
    const post = await this.prismaService.post.findUnique({
      where: { postId },
    });
    if (!post) throw new NotFoundException('Post not found');
    await this.prismaService.comment.create({
      data: {
        content,
        userId,
        postId,
      },
    });
    return { data: 'Comment created' };
  }
}
