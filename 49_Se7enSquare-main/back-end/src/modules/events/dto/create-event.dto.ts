import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Length, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ minLength: 3, maxLength: 60, example: 'Clan Tournament Qualifier' })
  @IsString()
  @Length(3, 60)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 220, example: 'Qualifier round for monthly tournament' })
  @IsString()
  @Length(10, 220)
  description!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId!: number;

  @ApiProperty({ example: '2026-05-20T16:30:00.000Z' })
  @IsDateString()
  date!: string;
}
