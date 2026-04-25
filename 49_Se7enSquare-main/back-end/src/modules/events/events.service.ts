import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, EventRecord, nextId } from '../../common/utils/in-memory-db';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  findAll(): EventRecord[] {
    return db.events;
  }

  findOne(id: number): EventRecord {
    const event = db.events.find((item) => item.id === id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  create(payload: CreateEventDto): EventRecord {
    const community = db.communities.find((item) => item.id === payload.communityId);
    if (!community) {
      throw new BadRequestException('communityId must reference an existing community');
    }

    const created: EventRecord = {
      id: nextId('event'),
      ...payload,
    };

    db.events.push(created);
    return created;
  }

  update(id: number, payload: UpdateEventDto): EventRecord {
    const event = this.findOne(id);

    if (payload.communityId) {
      const community = db.communities.find((item) => item.id === payload.communityId);
      if (!community) {
        throw new BadRequestException('communityId must reference an existing community');
      }
    }

    Object.assign(event, payload);
    return event;
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.events = db.events.filter((item) => item.id !== id);
    return { message: `Event ${id} deleted` };
  }
}
