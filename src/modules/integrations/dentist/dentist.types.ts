export interface DentistAuthResponse {
    token: string;
    expires_at?: string;
}

export interface DentistBranch {
    id: number;
    name: string;
    address?: string | null;
}

export interface DentistDoctor {
    id: number;
    fname?: string;
    lname?: string;
    mname?: string;
    full_name?: string;
    name?: string;
    specialization?: string | null;
    branch_id?: number | null;
}

export interface DentistPatient {
    id: number;
    fname?: string;
    lname?: string;
    mname?: string;
    phone?: string | null;
    mobile?: string | null;
}

export interface DentistScheduleItem {
    doctor_id: number;
    branch_id: number;
    start: string;
    end: string;
}

export interface DentistVisit {
    id: number;
    patient_id: number;
    doctor_id: number;
    branch_id: number;
    start: string;
    end: string;
    status?: string;
}

export interface DentistCreatePatientPayload {
    branch_id: number;
    fname: string;
    lname: string;
    mname?: string;
    phone?: string;
}

export interface DentistCreateVisitPayload {
    branch_id: number;
    patient_id: number;
    doctor_id: number;
    start: string;
    end: string;
    description?: string;
}