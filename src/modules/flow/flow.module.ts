import { Module } from '@nestjs/common';
import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { DentistModule } from '../integrations/dentist/dentist.module';
import { BitrixModule } from '../integrations/bitrix/bitrix.module';
import { PatientSyncService } from './patient-sync.service';

@Module({
  imports: [DentistModule, BitrixModule],
  controllers: [FlowController],
  providers: [FlowService, PatientSyncService],
  exports: [FlowService],
})
export class FlowModule {}