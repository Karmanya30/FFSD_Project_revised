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
import { CommunitiesService } from './communities.service';
import { CommunityDto } from './dto/community.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@ApiTags('communities')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | moderator | user',
})
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get all communities' })
  @ApiOkResponse({ type: CommunityDto, isArray: true })
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get community by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: CommunityDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.USER)
  @ApiOperation({ summary: 'Create community' })
  @ApiBody({ type: CreateCommunityDto })
  @ApiCreatedResponse({ type: CommunityDto })
  create(@Body() payload: CreateCommunityDto) {
    return this.communitiesService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.USER)
  @ApiOperation({ summary: 'Update community' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCommunityDto })
  @ApiOkResponse({ type: CommunityDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Delete community' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { message: 'Community 3 deleted' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.remove(id);
  }
}
