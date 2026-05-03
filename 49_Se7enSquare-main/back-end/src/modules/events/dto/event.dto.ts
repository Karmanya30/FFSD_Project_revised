import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Friday Scrim Night' })
  title!: string;

  @ApiProperty({ example: 'Weekly custom matches' })
  description!: string;

  @ApiProperty({ example: 1 })
  communityId!: number;

  @ApiProperty({ example: '2026-05-09' })
  date!: string;

  @ApiPropertyOptional({ example: '6:00 PM' })
  time?: string;

  @ApiPropertyOptional({ example: 'tournament' })
  type?: string;

  @ApiPropertyOptional({ example: 48 })
  attendees?: number;

  @ApiPropertyOptional({ example: 100 })
  maxAttendees?: number;

  @ApiPropertyOptional({ example: 'approved' })
  status?: string;

  @ApiPropertyOptional({ example: 'Rajat' })
  createdBy?: string;
}

