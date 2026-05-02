import { ApiProperty } from '@nestjs/swagger';

export class EventDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Friday Scrim Night' })
  title!: string;

  @ApiProperty({ example: 'Weekly custom matches' })
  description!: string;

  @ApiProperty({ example: 1 })
  communityId!: number;

  @ApiProperty({ example: '2026-05-02T18:00:00.000Z' })
  date!: string;
}
