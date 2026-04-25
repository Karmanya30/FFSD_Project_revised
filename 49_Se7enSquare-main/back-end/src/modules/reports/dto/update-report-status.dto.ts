import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from './report.dto';

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus, example: ReportStatus.REVIEWED })
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
