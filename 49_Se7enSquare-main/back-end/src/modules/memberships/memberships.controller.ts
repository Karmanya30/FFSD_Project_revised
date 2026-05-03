import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MembershipsService } from './memberships.service';

@ApiTags('memberships')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | community_manager | moderator | user',
})
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'List all memberships, optionally filtered by communityId or userId' })
  @ApiQuery({ name: 'communityId', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOkResponse({ schema: { example: [{ id: 1, userId: 3, communityId: 1, joinedAt: '2026-01-15T11:30:00.000Z' }] } })
  findAll(
    @Query('communityId') communityId?: string,
    @Query('userId') userId?: string,
  ) {
    if (communityId) return this.membershipsService.findByCommunity(Number(communityId));
    if (userId) return this.membershipsService.findByUser(Number(userId));
    return this.membershipsService.findAll();
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Join a community (create membership)' })
  @ApiBody({ type: CreateMembershipDto })
  @ApiCreatedResponse({ schema: { example: { id: 5, userId: 3, communityId: 1, joinedAt: '2026-05-02T12:00:00.000Z' } } })
  create(@Body() payload: CreateMembershipDto) {
    return this.membershipsService.create(payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Leave a community (delete membership by id)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { message: 'Membership 5 removed' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.membershipsService.remove(id);
  }
}
