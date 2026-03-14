import { Injectable } from '@nestjs/common';
import { BitrixService } from '../integrations/bitrix/bitrix.service';
import { DentistService } from '../integrations/dentist/dentist.service';
import { PatientSyncService } from './patient-sync.service';

@Injectable()
export class FlowService {
  constructor(
      private readonly dentistService: DentistService,
      private readonly bitrixService: BitrixService,
      private readonly patientSyncService: PatientSyncService,
  ) {}

  async processIncomingMessage(input: {
    phone: string;
    message: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    branchId?: number;
  }) {
    const syncResult = await this.patientSyncService.ensurePatientEverywhere(input);

    return {
      ok: true,
      patientCreated: syncResult.patientCreated,
      patient: syncResult.patient,
      bitrix: {
        contactId: syncResult.bitrix.contactId,
        dealId: syncResult.bitrix.dealId,
        contactCreated: syncResult.bitrix.contactCreated,
        dealCreated: syncResult.bitrix.dealCreated,
      },
      nextAction: 'continue_booking_or_operator_processing',
    };
  }

  async processSuccessfulVisitCreation(input: {
    patientId: number;
    doctorId: number;
    branchId: number;
    start: string;
    end: string;
    description?: string;
  }) {
    const visit = await this.dentistService.createVisit({
      patientId: input.patientId,
      doctorId: input.doctorId,
      branchId: input.branchId,
      start: input.start,
      end: input.end,
      description: input.description,
    });

    const resolvedPatientId = visit?.patientId ?? input.patientId;
    const resolvedDoctorId = visit?.doctorId ?? input.doctorId;
    const resolvedBranchId = visit?.branchId ?? input.branchId;
    const resolvedStart = visit?.start ?? input.start;
    const resolvedEnd = visit?.end ?? input.end;
    const resolvedVisitId = visit?.id;

    if (!resolvedPatientId) {
      throw new Error('Visit created but patientId is missing');
    }

    if (!resolvedVisitId) {
      throw new Error('Visit created but visit.id is missing');
    }

    console.log('VISIT_CREATE_RESULT', visit);

    const bitrix = await this.bitrixService.ensureVisitDealAndMoveRequest({
      patientId: resolvedPatientId,
      doctorId: resolvedDoctorId,
      branchId: resolvedBranchId,
      start: resolvedStart,
      end: resolvedEnd,
      dentistPlusVisitId: resolvedVisitId,
    });

    return {
      ok: true,
      visit,
      bitrix,
    };
  }

  async processPatientArrived(input: {
    patientId: number;
    visitId: number;
  }) {
    const contact = await this.bitrixService.findContactByDentistPlusPatientId(
        input.patientId,
    );

    let requestDealId: number | null = null;

    if (contact?.ID) {
      const requestDeal = await this.bitrixService.findOpenRequestDealByContactId(
          Number(contact.ID),
      );

      if (requestDeal?.ID) {
        requestDealId = Number(requestDeal.ID);
        await this.bitrixService.appendDealComment(
            requestDealId,
            `Пациент пришел на визит. Dentist Plus visitId=${input.visitId}`,
        );
      }
    }

    const visitDeal = await this.bitrixService.findVisitDealByDentistPlusVisitId(
        input.visitId,
    );

    if (visitDeal?.ID) {
      await this.bitrixService.appendDealComment(
          Number(visitDeal.ID),
          `Пациент пришел на визит. Dentist Plus visitId=${input.visitId}`,
      );
    }

    return {
      ok: true,
      patientId: input.patientId,
      visitId: input.visitId,
      bitrix: {
        requestDealId,
        visitDealId: visitDeal?.ID ? Number(visitDeal.ID) : null,
      },
      note: 'Пациент отмечен как пришедший. Следующим этапом можно двигать в отдельную лечебную воронку.',
    };
  }

  async processPatientNoShow(input: {
    patientId: number;
    visitId: number;
  }) {
    const contact = await this.bitrixService.findContactByDentistPlusPatientId(
        input.patientId,
    );

    let requestDealId: number | null = null;

    if (contact?.ID) {
      const requestDeal = await this.bitrixService.findOpenRequestDealByContactId(
          Number(contact.ID),
      );

      if (requestDeal?.ID) {
        requestDealId = Number(requestDeal.ID);

        await this.bitrixService.updateDealStage(
            requestDealId,
            this.bitrixService.getStageIds().requests.stages.NO_SHOW,
        );

        await this.bitrixService.appendDealComment(
            requestDealId,
            `Пациент не пришел. Dentist Plus visitId=${input.visitId}`,
        );
      }
    }

    const visitDeal = await this.bitrixService.findVisitDealByDentistPlusVisitId(
        input.visitId,
    );

    if (visitDeal?.ID) {
      await this.bitrixService.appendDealComment(
          Number(visitDeal.ID),
          `Пациент не пришел. Dentist Plus visitId=${input.visitId}`,
      );
    }

    return {
      ok: true,
      patientId: input.patientId,
      visitId: input.visitId,
      bitrix: {
        requestDealId,
        visitDealId: visitDeal?.ID ? Number(visitDeal.ID) : null,
        movedRequestStageTo: this.bitrixService.getStageIds().requests.stages.NO_SHOW,
      },
    };
  }
}