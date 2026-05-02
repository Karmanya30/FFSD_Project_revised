import { ApiProperty } from '@nestjs/swagger';

export class CommunityDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'FPS Arena' })
  name!: string;

  @ApiProperty({ example: 'Competitive FPS players and tournaments' })
  description!: string;

  @ApiProperty({ example: 3 })
  ownerId!: number;

  @ApiProperty({ example: ['fps', 'esports'], type: [String] })
  tags!: string[];
}
