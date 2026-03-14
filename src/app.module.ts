import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { DentistModule } from './modules/integrations/dentist/dentist.module';
import { BitrixModule } from './modules/integrations/bitrix/bitrix.module';
import { FlowModule } from './modules/flow/flow.module';

@Module({
    imports: [
        PrismaModule,
        HealthModule,
        DentistModule,
        BitrixModule,
        FlowModule,
    ],
})
export class AppModule {}