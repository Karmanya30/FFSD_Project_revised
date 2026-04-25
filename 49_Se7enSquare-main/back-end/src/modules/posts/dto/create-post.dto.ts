import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ minLength: 3, maxLength: 100, example: 'Tournament practice tonight' })
  @IsString()
  @Length(3, 100)
  title!: string;

  @ApiProperty({ minLength: 8, maxLength: 500, example: 'Join us at 9PM for ranked practice sessions' })
  @IsString()
  @Length(8, 500)
  content!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId!: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId!: number;
}
