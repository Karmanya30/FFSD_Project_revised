import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityRecord, db, nextId } from '../../common/utils/in-memory-db';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunitiesService {
  findAll(): CommunityRecord[] {
    return db.communities;
  }

  findOne(id: number): CommunityRecord {
    const community = db.communities.find((item) => item.id === id);
    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }
    return community;
  }

  create(payload: CreateCommunityDto): CommunityRecord {
    const owner = db.users.find((user) => user.id === payload.ownerId);
    if (!owner) {
      throw new BadRequestException('ownerId must reference an existing user');
    }

    const created: CommunityRecord = {
      id: nextId('community'),
      ...payload,
    };

    db.communities.push(created);
    return created;
  }

  update(id: number, payload: UpdateCommunityDto): CommunityRecord {
    const community = this.findOne(id);

    if (payload.ownerId) {
      const owner = db.users.find((user) => user.id === payload.ownerId);
      if (!owner) {
        throw new BadRequestException('ownerId must reference an existing user');
      }
    }

    Object.assign(community, payload);
    return community;
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.communities = db.communities.filter((item) => item.id !== id);
    db.memberships = db.memberships.filter((item) => item.communityId !== id);
    db.events = db.events.filter((item) => item.communityId !== id);
    db.posts = db.posts.filter((item) => item.communityId !== id);
    db.reports = db.reports.filter((item) => !(item.targetType === 'community' && item.targetId === id));
    return { message: `Community ${id} deleted` };
  }
}
