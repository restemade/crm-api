import { Injectable } from '@nestjs/common';
import { dentistConfig } from '../../../config/dentist.config';
import { DentistClient } from './dentist.client';
import {
    DentistCreatePatientPayload,
    DentistCreateVisitPayload,
} from './dentist.types';

@Injectable()
export class DentistService {
    constructor(private readonly dentistClient: DentistClient) {}

    authorize() {
        return this.dentistClient.authorize();
    }

    getBranches() {
        return this.dentistClient.getBranches();
    }

    getDoctors(params?: Record<string, unknown>) {
        return this.dentistClient.getDoctors(params);
    }

    async findPatientByPhone(phone: string) {
        const patients = await this.dentistClient.searchPatients(phone);

        return patients.find((patient) => {
            const candidate = patient.phone || patient.mobile || '';
            return candidate.replace(/\D/g, '').includes(phone.replace(/\D/g, ''));
        }) || null;
    }

    async createPatient(input: {
        firstName: string;
        lastName?: string;
        phone: string;
        branchId?: number;
    }) {
        const payload: DentistCreatePatientPayload = {
            branch_id: input.branchId ?? dentistConfig.defaultBranchId,
            fname: input.firstName,
            lname: input.lastName || dentistConfig.defaultPatientLastName,
            phone: input.phone,
        };

        return this.dentistClient.createPatient(payload);
    }

    getSchedule(params: {
        doctorId: number;
        branchId: number;
        dateFrom: string;
        dateTo: string;
    }) {
        return this.dentistClient.getSchedule({
            doctor_id: params.doctorId,
            branch_id: params.branchId,
            date_from: params.dateFrom,
            date_to: params.dateTo,
        });
    }

    getVisits(params: {
        doctorId?: number;
        patientId?: number;
        branchId?: number;
        dateFrom?: string;
        dateTo?: string;
    }) {
        return this.dentistClient.getVisits({
            doctor_id: params.doctorId,
            patient_id: params.patientId,
            branch_id: params.branchId,
            date_from: params.dateFrom,
            date_to: params.dateTo,
        });
    }

    createVisit(input: {
        branchId: number;
        patientId: number;
        doctorId: number;
        start: string;
        end: string;
        description?: string;
    }) {
        const payload: DentistCreateVisitPayload = {
            branch_id: input.branchId,
            patient_id: input.patientId,
            doctor_id: input.doctorId,
            start: input.start,
            end: input.end,
            description: input.description,
        };

        return this.dentistClient.createVisit(payload);
    }

    cancelVisit(visitId: number, reason: string) {
        return this.dentistClient.cancelVisit(visitId, reason);
    }
}