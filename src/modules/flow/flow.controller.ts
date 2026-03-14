import { Body, Controller, Post } from '@nestjs/common';
import { FlowService } from './flow.service';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('incoming-message')
  async incomingMessage(
    @Body()
    body: {
      phone: string;
      message: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
      branchId?: number;
    },
  ) {
    return this.flowService.processIncomingMessage(body);
  }

  @Post('visit-created')
  async visitCreated(
    @Body()
    body: {
      patientId: number;
      doctorId: number;
      branchId: number;
      start: string;
      end: string;
    },
  ) {
    return this.flowService.processSuccessfulVisitCreation(body);
  }

  @Post('patient-arrived')
  async patientArrived(
    @Body()
    body: {
      patientId: number;
      visitId: number;
    },
  ) {
    return this.flowService.processPatientArrived(body);
  }

  @Post('patient-no-show')
  async patientNoShow(
    @Body()
    body: {
      patientId: number;
      visitId: number;
    },
  ) {
    return this.flowService.processPatientNoShow(body);
  }
}
