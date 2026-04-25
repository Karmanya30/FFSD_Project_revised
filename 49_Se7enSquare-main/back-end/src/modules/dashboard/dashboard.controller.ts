import { Controller, Get } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { DashboardStatsDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'Role for RBAC: admin | moderator | user',
})
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiOkResponse({ type: DashboardStatsDto })
  getStats() {
    return this.dashboardService.getStats();
  }
}
