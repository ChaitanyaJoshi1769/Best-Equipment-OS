import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0',
    };
  }

  @Get('live')
  async live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    return { status: 'ready' };
  }
}
