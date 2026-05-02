import { Injectable } from '@nestjs/common';
import { db } from '../../common/utils/in-memory-db';

@Injectable()
export class DashboardService {
  getStats() {
    return {
      totalUsers: db.users.length,
      totalCommunities: db.communities.length,
      totalEvents: db.events.length,
      pendingReportsCount: db.reports.filter((report) => report.status === 'pending').length,
    };
  }
}
