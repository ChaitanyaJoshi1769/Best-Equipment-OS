import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { OrgScoped } from '../../common/decorators/org-scoped.decorator';

@Controller('ai')
@UseGuards(JwtGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('scheduling/optimize')
  async optimizeScheduling(
    @OrgScoped() organizationId: string,
    @Body() body: { jobIds?: string[] },
  ) {
    const optimizations = await this.aiService.optimizeJobScheduling(
      organizationId,
      body.jobIds || [],
    );
    return { data: optimizations };
  }

  @Get('routes/optimize/:vehicleId')
  async optimizeRoute(
    @OrgScoped() organizationId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    const optimizedRoute = await this.aiService.optimizeRoutes(organizationId, vehicleId);
    return optimizedRoute;
  }

  @Get('insights')
  async getAutomatedInsights(@OrgScoped() organizationId: string) {
    const insights = await this.aiService.generateAutomatedInsights(organizationId);
    return { data: insights };
  }

  @Post('routes/batch-optimize')
  async batchOptimizeRoutes(
    @OrgScoped() organizationId: string,
    @Body() body: { vehicleIds: string[] },
  ) {
    const results = [];
    for (const vehicleId of body.vehicleIds) {
      const route = await this.aiService.optimizeRoutes(organizationId, vehicleId);
      results.push(route);
    }
    return { data: results };
  }
}
