import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { DentistModule } from './modules/integrations/dentist/dentist.module';

@Module({
    imports: [
        PrismaModule,
        HealthModule,
        DentistModule,
    ],
})
export class AppModule {}