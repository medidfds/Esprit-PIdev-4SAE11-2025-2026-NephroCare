import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AvailabilityStatus = 'CONFIRMED' | 'UNAVAILABLE' | 'NO_RESPONSE';
export type ChildMood = 'CALM' | 'ANXIOUS' | 'REFUSING';

export interface PatientAvailabilityResponseDto {
  scheduledSessionId: string;
  patientId: string;
  availabilityStatus: AvailabilityStatus;
  childMood: ChildMood;
  transportNeeded: boolean;
  hasTransportAlternative: boolean;
  responseTime?: string;
}

export interface PatientAvailabilityResponseRequest {
  availabilityStatus: AvailabilityStatus;
  childMood: ChildMood;
  transportNeeded: boolean;
  hasTransportAlternative: boolean;
  comment?: string;
}

export interface PatientReadinessResponseDto {
  scheduledSessionId: string;
  readinessStatus: 'READY' | 'READY_WITH_WARNING' | 'NOT_READY';
  globalScore: number;
  blockingReason?: string;
  warningReason?: string;
}

export interface PatientTransportPreferenceDto {
  id: string;
  patientId: string;
  defaultTransportNeeded: boolean;
  hasTransportAlternative: boolean;
  preferredPickupZone: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  wheelchairRequired: boolean;
  notes?: string;
}

export interface SaveTransportPreferenceRequestDto {
  defaultTransportNeeded: boolean;
  hasTransportAlternative: boolean;
  preferredPickupZone: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  wheelchairRequired: boolean;
  notes?: string;
}

export type TransportRequestStatus =
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

export interface TransportRequestDto {
  id: string;
  scheduledSessionId: string;
  patientId: string;
  status: TransportRequestStatus;
  pickupZone?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  wheelchairRequired: boolean;
  rejectionReason?: string;
  /** null = not yet grouped / assigned */
  assignedVehicleCode?: string | null;
  /** null = no ride group yet; otherwise the RideGroupStatus enum value */
  assignedGroupStatus?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DialysisTransportFrontService {
  private readonly baseUrl = 'http://localhost:8085/api/patient';

  constructor(private http: HttpClient) {}

  getAvailability(sessionId: string): Observable<PatientAvailabilityResponseDto> {
    return this.http.get<PatientAvailabilityResponseDto>(`${this.baseUrl}/availability/${sessionId}`);
  }

  respondToAvailability(sessionId: string, payload: PatientAvailabilityResponseRequest): Observable<PatientAvailabilityResponseDto> {
    return this.http.put<PatientAvailabilityResponseDto>(`${this.baseUrl}/availability/${sessionId}/response`, payload);
  }

  getReadiness(sessionId: string): Observable<PatientReadinessResponseDto> {
    return this.http.get<PatientReadinessResponseDto>(`${this.baseUrl}/readiness/${sessionId}`);
  }

  getTransportBySession(sessionId: string): Observable<TransportRequestDto> {
    return this.http.get<TransportRequestDto>(`${this.baseUrl}/transport/session/${sessionId}`);
  }

  getPreference(patientId: string): Observable<PatientTransportPreferenceDto> {
    return this.http.get<PatientTransportPreferenceDto>(`${this.baseUrl}/preferences/transport/${patientId}`);
  }

  saveOrUpdatePreference(patientId: string, payload: SaveTransportPreferenceRequestDto): Observable<PatientTransportPreferenceDto> {
    return this.http.put<PatientTransportPreferenceDto>(`${this.baseUrl}/preferences/transport/${patientId}`, payload);
  }
}
