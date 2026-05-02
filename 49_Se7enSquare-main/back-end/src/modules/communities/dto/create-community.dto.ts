import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ minLength: 3, maxLength: 50, example: 'MOBA Masters' })
  @IsString()
  @Length(3, 50)
  name!: string;

  @ApiProperty({ minLength: 10, maxLength: 200, example: 'Community for strategy and ranked discussions' })
  @IsString()
  @Length(10, 200)
  description!: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerId!: number;

  @ApiProperty({ type: [String], example: ['moba', 'ranked'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Length(2, 20, { each: true })
  tags!: string[];
}
