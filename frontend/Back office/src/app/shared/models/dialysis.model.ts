export interface DialysisTreatment {
    id: string;
    patientId: string;
    doctorId: string;
    dialysisType: 'HEMODIALYSIS' | 'PERITONEAL';
    vascularAccessType: 'AV_FISTULA' | 'GRAFT' | 'CATHETER';
    frequencyPerWeek: number;
    prescribedDurationMinutes: number;
    targetDryWeight: number;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    startDate: string;
}

export interface DialysisSession {
    id: string;
    treatmentId: string;
    nurseId: string;
    weightBefore: number;
    weightAfter: number | null;
    ultrafiltrationVolume: number | null;
    preBloodPressure: string;
    complications: string;
}