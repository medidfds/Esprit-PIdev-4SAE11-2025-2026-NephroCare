import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DialysisTreatment, DialysisSession } from '../models/dialysis.model';

@Injectable({
    providedIn: 'root'
})
export class DialysisService {
    // Adjust this if your environment setup is different
    private baseUrl = 'http://localhost:8075/api';

    constructor(private http: HttpClient) {}

    // ===============================
    // TREATMENT METHODS
    // ===============================

    // 1. Get All
    getTreatments(): Observable<DialysisTreatment[]> {
        return this.http.get<DialysisTreatment[]>(`${this.baseUrl}/treatments`);
    }

    // 2. Create (Add)
    addTreatment(dto: DialysisTreatment): Observable<DialysisTreatment> {
        return this.http.post<DialysisTreatment>(`${this.baseUrl}/treatments`, dto);
    }

    // 3. Update
    updateTreatment(id: string, dto: DialysisTreatment): Observable<DialysisTreatment> {
        return this.http.put<DialysisTreatment>(`${this.baseUrl}/treatments/${id}`, dto);
    }

    // 4. Delete
    deleteTreatment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/treatments/${id}`);
    }

    // 5. Suspend (Business Logic)
    suspendTreatment(id: string, reason: string): Observable<DialysisTreatment> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<DialysisTreatment>(`${this.baseUrl}/treatments/${id}/suspend`, null, { params });
    }

    // 6. Archive (Business Logic)
    archiveTreatment(id: string): Observable<DialysisTreatment> {
        return this.http.patch<DialysisTreatment>(`${this.baseUrl}/treatments/${id}/archive`, null);
    }

    // ===============================
    // SESSION METHODS
    // ===============================

    // 1. Get Sessions by Treatment
    getSessionsByTreatment(treatmentId: string): Observable<DialysisSession[]> {
        return this.http.get<DialysisSession[]>(`${this.baseUrl}/sessions/treatment/${treatmentId}`);
    }

    // 2. Start Session (Create)
    startSession(dto: any): Observable<DialysisSession> {
        return this.http.post<DialysisSession>(`${this.baseUrl}/sessions`, dto);
    }

    // 3. End Session (Calculations)
    endSession(sessionId: string, data: { weightAfter: number, postDialysisUrea: number, preDialysisUrea: number }): Observable<DialysisSession> {
        let params = new HttpParams()
            .set('weightAfter', data.weightAfter.toString())
            .set('postDialysisUrea', data.postDialysisUrea.toString())
            .set('preDialysisUrea', data.preDialysisUrea.toString());

        return this.http.put<DialysisSession>(`${this.baseUrl}/sessions/${sessionId}/end`, null, { params });
    }
}