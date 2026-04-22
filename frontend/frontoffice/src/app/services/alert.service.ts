import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alert {
    id: string;
    patientId: string;
    sessionId?: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    category: string;
    title: string;
    message: string;
    status: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private readonly baseUrl = 'http://localhost:8075/api/alerts';

    constructor(private http: HttpClient) {}

    getMyOpenAlerts(): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.baseUrl}/my/open`);
    }
}
