import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
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
  description: 'Role for RBAC: admin | moderator | user',
})
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({ summary: 'List reports' })
  @ApiOkResponse({ type: ReportDto, isArray: true })
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  @Roles(AppRole.USER, AppRole.MODERATOR, AppRole.ADMIN)
  @ApiOperation({ summary: 'Create report' })
  @ApiBody({ type: CreateReportDto })
  @ApiCreatedResponse({ type: ReportDto })
  create(@Body() payload: CreateReportDto) {
    return this.reportsService.create(payload);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  @ApiOperation({ summary: 'Update report status (pending -> reviewed -> resolved)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateReportStatusDto })
  @ApiOkResponse({ type: ReportDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, payload.status);
  }
}
