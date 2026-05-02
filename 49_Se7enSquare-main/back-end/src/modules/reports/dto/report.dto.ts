import { ApiProperty } from '@nestjs/swagger';

export enum ReportTargetType {
  POST = 'post',
  USER = 'user',
  COMMUNITY = 'community',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

export class ReportDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 3 })
  reporterId!: number;

  @ApiProperty({ enum: ReportTargetType, example: ReportTargetType.POST })
  targetType!: ReportTargetType;

  @ApiProperty({ example: 1 })
  targetId!: number;

  @ApiProperty({ example: 'Potential harassment in comments' })
  reason!: string;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.PENDING })
  status!: ReportStatus;
}
