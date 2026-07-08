import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { message: string; data: { status: string; timestamp: string } } {
    return {
      message: 'Senior Connect API is healthy',
      data: { status: 'ok', timestamp: new Date().toISOString() },
    };
  }
}
