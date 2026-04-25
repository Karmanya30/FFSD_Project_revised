import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Length, Min } from 'class-validator';
import { ReportTargetType } from './report.dto';

export class CreateReportDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reporterId!: number;

  @ApiProperty({ enum: ReportTargetType, example: ReportTargetType.POST })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetId!: number;

  @ApiProperty({ minLength: 8, maxLength: 200, example: 'Abusive language found in comments' })
  @IsString()
  @Length(8, 200)
  reason!: string;
}
