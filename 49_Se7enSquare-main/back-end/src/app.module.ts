import { Module } from '@nestjs/common';
import { CommunitiesModule } from './modules/communities/communities.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { PostsModule } from './modules/posts/posts.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    RbacModule,
    UsersModule,
    CommunitiesModule,
    EventsModule,
    ReportsModule,
    PostsModule,
    DashboardModule,
  ],
})
export class AppModule {}
