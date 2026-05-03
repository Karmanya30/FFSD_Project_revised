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
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('users')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. Accepted values: admin | community_manager | moderator | user. ' +
    'GET endpoints require any valid role. POST / PATCH / DELETE require admin.',
  schema: { type: 'string', enum: ['admin', 'community_manager', 'moderator', 'user'] },
})
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns every user in the in-memory store. Accessible by any valid role.',
  })
  @ApiOkResponse({ type: UserDto, isArray: true, description: 'Array of user records' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({
    summary: 'Get a single user by ID',
    description: 'Fetches one user record by their numeric ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric user ID' })
  @ApiOkResponse({ type: UserDto, description: 'The matching user record' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a user record. Requires x-role: admin.',
  })
  @ApiBody({ type: CreateUserDto, description: 'User creation payload' })
  @ApiCreatedResponse({ type: UserDto, description: 'The newly created user' })
  @ApiForbiddenResponse({ description: 'Only admin can create users' })
  create(@Body() payload: CreateUserDto) {
    return this.usersService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Update an existing user',
    description: 'Partially updates a user (all fields optional). Requires x-role: admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric user ID to update' })
  @ApiBody({ type: UpdateUserDto, description: 'Fields to update (all optional)' })
  @ApiOkResponse({ type: UserDto, description: 'The updated user record' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Only admin can update users' })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateUserDto) {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a user',
    description:
      'Permanently deletes a user and cascades to their memberships, posts, and reports. Requires x-role: admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric user ID to delete' })
  @ApiOkResponse({ schema: { example: { message: 'User 4 deleted' } }, description: 'Deletion confirmation' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Only admin can delete users' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
