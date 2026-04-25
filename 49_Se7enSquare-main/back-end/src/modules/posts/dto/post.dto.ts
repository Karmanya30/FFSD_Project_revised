import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Looking for squad' })
  title!: string;

  @ApiProperty({ example: 'Need two players for ranked grind' })
  content!: string;

  @ApiProperty({ example: 1 })
  communityId!: number;

  @ApiProperty({ example: 3 })
  authorId!: number;
}
