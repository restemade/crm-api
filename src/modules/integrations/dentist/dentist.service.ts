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

    private normalizePhone(phone: string): string {
        return phone.replace(/\D/g, '');
    }

    private cleanNamePart(value?: string | null): string | null {
        if (!value) return null;

        const cleaned = value.trim();

        if (!cleaned) return null;

        if (/^[,.\-_\s]+$/.test(cleaned)) {
            return null;
        }

        return cleaned;
    }

    private buildFullName(parts: Array<string | null | undefined>): string {
        return parts
            .filter((part): part is string => Boolean(part && part.trim()))
            .join(' ');
    }

    async authorize() {
        const token = await this.dentistClient.authorize();

        return {
            ok: true,
            tokenPreview: token.slice(0, 12) + '...',
        };
    }

    async getBranches() {
        const response = await this.dentistClient.getBranches();

        return response.data.map((branch) => ({
            id: branch.id,
            title: branch.title,
            address: branch.address,
            phone: branch.phone,
            email: branch.email,
        }));
    }

    async getDoctors(params?: Record<string, unknown>) {
        const response = await this.dentistClient.getDoctors(params);

        return response.data.map((doctor) => {
            const firstName = this.cleanNamePart(doctor.fname);
            const lastName = this.cleanNamePart(doctor.lname);
            const middleName = this.cleanNamePart(doctor.mname);

            return {
                id: doctor.id,
                fullName:
                    this.buildFullName([lastName, firstName, middleName]) ||
                    firstName ||
                    'Без имени',
                firstName,
                lastName,
                middleName,
                phone: doctor.phone,
                email: doctor.email,
                branches: doctor.branches.map((branch) => ({
                    id: branch.id,
                    title: branch.title,
                })),
                professions: doctor.professions.map((profession) => profession.title),
                color: doctor.color,
                deleted: doctor.deleted,
            };
        });
    }

    async searchPatients(search: string) {
        const response = await this.dentistClient.searchPatients(search);

        return response.data.map((patient) => {
            const firstName = this.cleanNamePart(patient.fname);
            const lastName = this.cleanNamePart(patient.lname);
            const middleName = this.cleanNamePart(patient.mname);

            return {
                id: patient.id,
                fullName:
                    this.buildFullName([lastName, firstName, middleName]) ||
                    firstName ||
                    'Без имени',
                firstName,
                lastName,
                middleName,
                phone: patient.phone,
                phone2: patient.phone_2,
                email: patient.email,
                gender: patient.gender,
                dateOfBirth: patient.date_of_birth,
            };
        });
    }

    async findPatientByPhone(phone: string) {
        const normalizedInput = this.normalizePhone(phone);
        const response = await this.dentistClient.searchPatients(phone);

        const patients = response.data.map((patient) => {
            const firstName = this.cleanNamePart(patient.fname);
            const lastName = this.cleanNamePart(patient.lname);
            const middleName = this.cleanNamePart(patient.mname);

            return {
                id: patient.id,
                fullName:
                    this.buildFullName([lastName, firstName, middleName]) ||
                    firstName ||
                    'Без имени',
                firstName,
                lastName,
                middleName,
                phone: patient.phone,
                phone2: patient.phone_2,
                email: patient.email,
                gender: patient.gender,
                dateOfBirth: patient.date_of_birth,
            };
        });

        const exactMatch = patients.find((patient) => {
            const p1 = patient.phone ? this.normalizePhone(patient.phone) : '';
            const p2 = patient.phone2 ? this.normalizePhone(patient.phone2) : '';
            return p1 === normalizedInput || p2 === normalizedInput;
        });

        return exactMatch || null;
    }

    async createPatient(input: {
        firstName: string;
        lastName?: string;
        middleName?: string;
        phone: string;
        phone2?: string;
        email?: string;
        gender?: string;
        dateOfBirth?: string;
        branchId?: number;
    }) {
        const payload: DentistCreatePatientPayload = {
            branch_id: input.branchId ?? dentistConfig.defaultBranchId,
            fname: input.firstName,
            lname: input.lastName || dentistConfig.defaultPatientLastName,
            mname: input.middleName,
            phone: input.phone,
            phone_2: input.phone2,
            email: input.email,
            gender: input.gender,
            date_of_birth: input.dateOfBirth,
        };

        const patient = await this.dentistClient.createPatient(payload);

        const firstName = this.cleanNamePart(patient.fname);
        const lastName = this.cleanNamePart(patient.lname);
        const middleName = this.cleanNamePart(patient.mname);

        return {
            id: patient.id,
            fullName:
                this.buildFullName([lastName, firstName, middleName]) ||
                firstName ||
                'Без имени',
            firstName,
            lastName,
            middleName,
            phone: patient.phone,
            phone2: patient.phone_2,
            email: patient.email,
            gender: patient.gender,
            dateOfBirth: patient.date_of_birth,
        };
    }

    async getSchedule(input: {
        doctorId: number;
        branchId: number;
        dateFrom: string;
        dateTo: string;
    }) {
        const response = await this.dentistClient.getSchedule({
            doctor_id: input.doctorId,
            branch_id: input.branchId,
            date_from: input.dateFrom,
            date_to: input.dateTo,
        });

        return response.map((item) => ({
            doctorId: item.doctor_id,
            branchId: item.branch_id,
            day: item.day,
            timeFrom: item.time_from,
            timeTo: item.time_to,
            minutes: item.minutes,
        }));
    }

    async getVisits(input: {
        doctorId?: number;
        patientId?: number;
        branchId?: number;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const response = await this.dentistClient.getVisits({
            doctor_id: input.doctorId,
            patient_id: input.patientId,
            branch_id: input.branchId,
            date_from: input.dateFrom,
            date_to: input.dateTo,
        });

        return response.data.map((visit) => ({
            id: visit.id,
            patientId: visit.patient_id,
            doctorId: visit.doctor_id,
            branchId: visit.branch_id,
            start: visit.start,
            end: visit.end,
            description: visit.description,
            status: visit.status,
            createdAt: visit.created_at,
            updatedAt: visit.updated_at,
        }));
    }

    async createVisit(input: {
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

        const visit = await this.dentistClient.createVisit(payload);

        return {
            id: visit.id,
            patientId: visit.patient_id,
            doctorId: visit.doctor_id,
            branchId: visit.branch_id,
            start: visit.start,
            end: visit.end,
            description: visit.description,
            status: visit.status,
            createdAt: visit.created_at,
            updatedAt: visit.updated_at,
        };
    }
}