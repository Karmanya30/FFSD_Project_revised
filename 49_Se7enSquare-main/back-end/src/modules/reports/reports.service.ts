import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, nextId, ReportRecord } from '../../common/utils/in-memory-db';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, ReportTargetType } from './dto/report.dto';

@Injectable()
export class ReportsService {
  findAll(): ReportRecord[] {
    return db.reports;
  }

  findOne(id: number): ReportRecord {
    const report = db.reports.find((item) => item.id === id);
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }
    return report;
  }

  create(payload: CreateReportDto): ReportRecord {
    const reporter = db.users.find((item) => item.id === payload.reporterId);
    if (!reporter) {
      throw new BadRequestException('reporterId must reference an existing user');
    }

    this.validateTarget(payload.targetType, payload.targetId);

    const created: ReportRecord = {
      id: nextId('report'),
      ...payload,
      status: ReportStatus.PENDING,
    };

    db.reports.push(created);
    return created;
  }

  updateStatus(id: number, status: ReportStatus): ReportRecord {
    const report = this.findOne(id);

    const allowedTransitions: Record<ReportStatus, ReportStatus | null> = {
      [ReportStatus.PENDING]: ReportStatus.REVIEWED,
      [ReportStatus.REVIEWED]: ReportStatus.RESOLVED,
      [ReportStatus.ESCALATED]: ReportStatus.RESOLVED,
      [ReportStatus.RESOLVED]: null,
    };

    const next = allowedTransitions[report.status as ReportStatus];
    const canEscalate = status === ReportStatus.ESCALATED &&
      (report.status === ReportStatus.PENDING || report.status === ReportStatus.REVIEWED);

    if (next !== status && !canEscalate) {
      throw new BadRequestException(
        `Invalid status transition. Allowed: ${report.status} -> ${next ?? 'none'}${canEscalate ? ' or escalated' : ''}`,
      );
    }

    report.status = status;
    if (status === ReportStatus.ESCALATED) {
      report.escalatedTo = 'admin';
    }
    return report;
  }

  private validateTarget(targetType: ReportTargetType, targetId: number): void {
    const exists =
      (targetType === ReportTargetType.POST && db.posts.some((item) => item.id === targetId)) ||
      (targetType === ReportTargetType.USER && db.users.some((item) => item.id === targetId)) ||
      (targetType === ReportTargetType.COMMUNITY &&
        db.communities.some((item) => item.id === targetId));

    if (!exists) {
      throw new BadRequestException(`targetId ${targetId} does not match existing ${targetType}`);
    }
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.reports = db.reports.filter((item) => item.id !== id);
    return { message: `Report ${id} deleted` };
  }
}
