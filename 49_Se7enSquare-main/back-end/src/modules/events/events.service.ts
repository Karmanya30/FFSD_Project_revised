import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, EventRecord, nextId } from '../../common/utils/in-memory-db';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  findAll(status?: string): EventRecord[] {
    if (status) {
      return db.events.filter((item) => item.status === status);
    }
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

    const status = payload.status || 'pending';
    if (status === 'approved') {
      this.assertNoEventClash(payload.communityId, payload.date, payload.time);
    }

    const created: EventRecord = {
      id: nextId('event'),
      ...payload,
      status,
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

    const nextCommunityId = payload.communityId || event.communityId;
    const nextDate = payload.date || event.date;
    const nextTime = payload.time ?? event.time;
    const nextStatus = payload.status || event.status;

    if (nextStatus === 'approved') {
      this.assertNoEventClash(nextCommunityId, nextDate, nextTime, id);
    }

    Object.assign(event, payload);
    return event;
  }

  private assertNoEventClash(communityId: number, date: string, time?: string, ignoreId?: number): void {
    const clash = db.events.find((item) =>
      item.id !== ignoreId &&
      item.communityId === communityId &&
      item.status === 'approved' &&
      item.date === date &&
      (item.time || '') === (time || ''),
    );

    if (clash) {
      throw new BadRequestException('An approved event already exists for this community at the selected date and time');
    }
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.events = db.events.filter((item) => item.id !== id);
    return { message: `Event ${id} deleted` };
  }
}
