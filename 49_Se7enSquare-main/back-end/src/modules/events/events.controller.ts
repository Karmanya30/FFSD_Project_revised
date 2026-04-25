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
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | moderator | user',
})
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get all events' })
  @ApiOkResponse({ type: EventDto, isArray: true })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get event by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: EventDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Create event' })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ type: EventDto })
  create(@Body() payload: CreateEventDto) {
    return this.eventsService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({ type: EventDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateEventDto,
  ) {
    return this.eventsService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { message: 'Event 2 deleted' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }
}
