import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';

@Controller('advanced-analytics')
@UseGuards(JwtGuard)
export class AdvancedAnalyticsController {
  constructor(private analyticsService: AdvancedAnalyticsService) {}

  @Get('forecast/jobs/:daysAhead')
  async forecastJobCompletions(
    @OrgScoped() organizationId: string,
    @Param('daysAhead') daysAhead: number,
  ) {
    const forecast = await this.analyticsService.forecastJobCompletionTimes(organizationId, daysAhead);
    return { data: forecast };
  }

  @Get('forecast/maintenance/:daysAhead')
  async forecastMaintenance(
    @OrgScoped() organizationId: string,
    @Param('daysAhead') daysAhead: number,
  ) {
    const forecast = await this.analyticsService.forecastMaintenanceNeeds(organizationId, daysAhead);
    return { data: forecast };
  }

  @Get('anomalies/:metric')
  async detectAnomalies(
    @OrgScoped() organizationId: string,
    @Param('metric') metric: 'fuel' | 'speed' | 'temperature',
  ) {
    const anomalies = await this.analyticsService.detectAnomalies(organizationId, metric);
    return { data: anomalies };
  }

  @Get('insights')
  async getInsights(@OrgScoped() organizationId: string) {
    const insights = await this.analyticsService.generateInsights(organizationId);
    return { data: insights };
  }

  @Post('dashboards/create')
  createDashboard(
    @OrgScoped() organizationId: string,
    @Body() body: { name: string },
  ) {
    const dashboard = this.analyticsService.createDashboardTemplate(organizationId, body.name);
    return dashboard;
  }

  @Post('dashboards/:dashboardId/widgets')
  addWidgetToDashboard(
    @OrgScoped() organizationId: string,
    @Param('dashboardId') dashboardId: string,
    @Body() widgetData: any,
  ) {
    // In production, would fetch dashboard from DB first
    const mockDashboard = this.analyticsService.createDashboardTemplate(organizationId, 'temp');
    const updated = this.analyticsService.addWidgetToDashboard(mockDashboard, widgetData);
    return updated;
  }

  @Post('dashboards/:dashboardId/widgets/:widgetId/update')
  updateWidget(
    @OrgScoped() organizationId: string,
    @Param('dashboardId') dashboardId: string,
    @Param('widgetId') widgetId: string,
    @Body() widgetData: any,
  ) {
    const mockDashboard = this.analyticsService.createDashboardTemplate(organizationId, 'temp');
    const updated = this.analyticsService.updateDashboardWidget(mockDashboard, widgetId, widgetData);
    return updated;
  }
}
