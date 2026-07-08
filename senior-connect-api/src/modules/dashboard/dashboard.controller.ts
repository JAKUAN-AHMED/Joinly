import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { DashboardService } from './dashboard.service';
import { DASHBOARD_ROUTES } from './dashboard.routes';
import { RecentListDto } from './dto';

@Roles(UserRole.Admin)
@Controller(DASHBOARD_ROUTES.ROOT)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(DASHBOARD_ROUTES.STATISTICS)
  statistics() {
    return this.dashboardService.statistics();
  }

  @Get(DASHBOARD_ROUTES.CATEGORY_DISTRIBUTION)
  categoryDistribution() {
    return this.dashboardService.categoryDistribution();
  }

  @Get(DASHBOARD_ROUTES.RECENT_USERS)
  recentUsers(@Query() query: RecentListDto) {
    return this.dashboardService.recentUsers(query);
  }

  @Get(DASHBOARD_ROUTES.RECENT_ACTIVITIES)
  recentActivities(@Query() query: RecentListDto) {
    return this.dashboardService.recentActivities(query);
  }
}
