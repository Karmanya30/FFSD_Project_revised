import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | community_manager | moderator | user',
})
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiOkResponse({ type: PostDto, isArray: true })
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get post by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PostDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Create post' })
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({ type: PostDto })
  create(@Body() payload: CreatePostDto) {
    return this.postsService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Update post' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({ type: PostDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdatePostDto) {
    return this.postsService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({ summary: 'Delete post' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { message: 'Post 4 deleted' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
