import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. Accepted values: admin | community_manager | moderator | user. ' +
    'GET requires admin or moderator. POST requires any valid role. ' +
    'PATCH status requires admin or moderator. DELETE requires admin.',
  schema: { type: 'string', enum: ['admin', 'community_manager', 'moderator', 'user'] },
})
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({
    summary: 'List all reports',
    description: 'Returns all reports. Only accessible by admin or moderator roles.',
  })
  @ApiOkResponse({ type: ReportDto, isArray: true, description: 'Array of report records' })
  @ApiForbiddenResponse({ description: 'Only admin or moderator can view reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  @Roles(AppRole.USER, AppRole.MODERATOR, AppRole.COMMUNITY_MANAGER, AppRole.ADMIN)
  @ApiOperation({
    summary: 'Submit a report',
    description: 'Creates a new report (content or user report). Any authenticated role may submit a report. Status defaults to "pending".',
  })
  @ApiBody({ type: CreateReportDto, description: 'Report submission payload (reporterId, targetType, targetId, reason)' })
  @ApiCreatedResponse({ type: ReportDto, description: 'The newly submitted report with status: pending' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  create(@Body() payload: CreateReportDto) {
    return this.reportsService.create(payload);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({
    summary: 'Update report status',
    description:
      'Advances a report through the status lifecycle: pending -> reviewed -> resolved, or escalates to admin. ' +
      'Requires x-role: admin or moderator.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric report ID' })
  @ApiBody({
    type: UpdateReportStatusDto,
    description: 'New status value. Allowed: reviewed | escalated | resolved',
  })
  @ApiOkResponse({ type: ReportDto, description: 'The report with updated status' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiForbiddenResponse({ description: 'Only admin or moderator can update report status' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, payload.status);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a report',
    description: 'Permanently removes a report record. Requires x-role: admin.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric report ID to delete' })
  @ApiOkResponse({ schema: { example: { message: 'Report 1 deleted' } }, description: 'Deletion confirmation' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiForbiddenResponse({ description: 'Only admin can delete reports' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.remove(id);
  }
}
