import {
    BadGatewayException,
    Injectable,
    Logger,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { dentistConfig } from '../../../config/dentist.config';
import {
    DentistAuthResponse,
    DentistBranch,
    DentistCreatePatientPayload,
    DentistCreateVisitPayload,
    DentistDoctor,
    DentistPatient,
    DentistScheduleItem,
    DentistVisit,
} from './dentist.types';

@Injectable()
export class DentistClient {
    private readonly logger = new Logger(DentistClient.name);
    private readonly http: AxiosInstance;
    private accessToken: string | null = null;

    constructor() {
        this.http = axios.create({
            baseURL: dentistConfig.baseUrl,
            timeout: 20000,
        });
    }

    private async ensureToken(): Promise<string> {
        if (this.accessToken) {
            return this.accessToken;
        }

        return this.authorize();
    }

    async authorize(): Promise<string> {
        try {
            const { data } = await this.http.post<DentistAuthResponse>('/auth', {
                login: dentistConfig.login,
                pass: dentistConfig.password,
            });

            if (!data?.token) {
                throw new Error('Dentist API did not return token');
            }

            this.accessToken = data.token;
            return this.accessToken;
        } catch (error) {
            this.logger.error('Dentist authorize failed', error);
            throw new BadGatewayException('Failed to authorize in Dentist Plus');
        }
    }

    private async request<T>(
        method: 'GET' | 'POST' | 'PUT',
        url: string,
        data?: unknown,
        params?: Record<string, unknown>,
        retry = true,
    ): Promise<T> {
        const token = await this.ensureToken();

        try {
            const response = await this.http.request<T>({
                method,
                url,
                data,
                params,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error: any) {
            const status = error?.response?.status;

            if ((status === 401 || status === 403) && retry) {
                this.accessToken = null;
                await this.authorize();
                return this.request<T>(method, url, data, params, false);
            }

            this.logger.error(`Dentist request failed: ${method} ${url}`, error);
            throw new BadGatewayException(`Dentist request failed: ${url}`);
        }
    }

    async getBranches(): Promise<DentistBranch[]> {
        return this.request<DentistBranch[]>('GET', '/branches');
    }

    async getDoctors(params?: Record<string, unknown>): Promise<DentistDoctor[]> {
        return this.request<DentistDoctor[]>('GET', '/doctors', undefined, params);
    }

    async searchPatients(search: string): Promise<DentistPatient[]> {
        return this.request<DentistPatient[]>('GET', '/patients', undefined, { search });
    }

    async getPatientById(id: number): Promise<DentistPatient> {
        return this.request<DentistPatient>('GET', `/patients/${id}`);
    }

    async createPatient(payload: DentistCreatePatientPayload): Promise<DentistPatient> {
        return this.request<DentistPatient>('POST', '/patients', payload);
    }

    async getSchedule(params: {
        doctor_id: number;
        branch_id: number;
        date_from: string;
        date_to: string;
    }): Promise<DentistScheduleItem[]> {
        return this.request<DentistScheduleItem[]>('GET', '/schedule', undefined, params);
    }

    async getVisits(params: {
        doctor_id?: number;
        patient_id?: number;
        branch_id?: number;
        date_from?: string;
        date_to?: string;
    }): Promise<DentistVisit[]> {
        return this.request<DentistVisit[]>('GET', '/visits', undefined, params);
    }

    async createVisit(payload: DentistCreateVisitPayload): Promise<DentistVisit> {
        return this.request<DentistVisit>('POST', '/visits', payload);
    }

    async cancelVisit(id: number, reason: string): Promise<unknown> {
        return this.request('POST', `/visits/${id}/cancel`, { reason });
    }
}