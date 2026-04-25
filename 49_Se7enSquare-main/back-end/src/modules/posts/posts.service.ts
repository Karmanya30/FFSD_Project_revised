import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, nextId, PostRecord } from '../../common/utils/in-memory-db';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  findAll(): PostRecord[] {
    return db.posts;
  }

  findOne(id: number): PostRecord {
    const post = db.posts.find((item) => item.id === id);
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return post;
  }

  create(payload: CreatePostDto): PostRecord {
    this.validateReferences(payload.communityId, payload.authorId);

    const created: PostRecord = {
      id: nextId('post'),
      ...payload,
    };

    db.posts.push(created);
    return created;
  }

  update(id: number, payload: UpdatePostDto): PostRecord {
    const post = this.findOne(id);

    const communityId = payload.communityId ?? post.communityId;
    const authorId = payload.authorId ?? post.authorId;
    this.validateReferences(communityId, authorId);

    Object.assign(post, payload);
    return post;
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.posts = db.posts.filter((item) => item.id !== id);
    db.reports = db.reports.filter((item) => !(item.targetType === 'post' && item.targetId === id));
    return { message: `Post ${id} deleted` };
  }

  private validateReferences(communityId: number, authorId: number): void {
    const community = db.communities.find((item) => item.id === communityId);
    if (!community) {
      throw new BadRequestException('communityId must reference an existing community');
    }

    const author = db.users.find((item) => item.id === authorId);
    if (!author) {
      throw new BadRequestException('authorId must reference an existing user');
    }
  }
}
