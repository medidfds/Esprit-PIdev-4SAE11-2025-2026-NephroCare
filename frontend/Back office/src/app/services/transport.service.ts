import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle, TransportRequest, SharedRideGroup, ReadinessScore, EscalationLog } from '../pages/dialysis/readiness-transport/models/transport.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private apiUrl = `${environment.readinessTransportApiUrl}/api/admin/fleet`;
  private transportUrl = `${environment.readinessTransportApiUrl}/api/admin/transport`;

  constructor(private http: HttpClient) {}

  // Vehicles
  getActiveVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles/active`);
  }

  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`);
  }

  createVehicle(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, vehicle);
  }

  updateVehicle(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/vehicles/${id}`, vehicle);
  }

  toggleVehicleActive(id: string, active: boolean): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.apiUrl}/vehicles/${id}/active`, { active });
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`);
  }

  // Transport Requests
  getPendingRequests(): Observable<TransportRequest[]> {
    return this.http.get<TransportRequest[]>(`${this.transportUrl}/pending`);
  }

  approveRequest(id: string, comment?: string): Observable<TransportRequest> {
    return this.http.put<TransportRequest>(`${this.transportUrl}/${id}/approve`, { adminComment: comment });
  }

  rejectRequest(id: string, reason?: string): Observable<TransportRequest> {
    return this.http.put<TransportRequest>(`${this.transportUrl}/${id}/reject`, { rejectionReason: reason });
  }

  // Ride Groups
  getSharedRideGroups(): Observable<SharedRideGroup[]> {
    return this.http.get<SharedRideGroup[]>(`${environment.readinessTransportApiUrl}/api/admin/ride-groups`);
  }

  proposeRideGroups(): Observable<SharedRideGroup[]> {
    return this.http.post<SharedRideGroup[]>(`${environment.readinessTransportApiUrl}/api/admin/ride-groups/propose`, {});
  }

  validateRideGroup(id: string): Observable<SharedRideGroup> {
    return this.http.put<SharedRideGroup>(`${environment.readinessTransportApiUrl}/api/admin/ride-groups/${id}/validate`, {});
  }

  rejectRideGroup(id: string): Observable<SharedRideGroup> {
    return this.http.put<SharedRideGroup>(`${environment.readinessTransportApiUrl}/api/admin/ride-groups/${id}/reject`, {});
  }

  assignVehicleToGroup(groupId: string, vehicleId: string): Observable<SharedRideGroup> {
    return this.http.put<SharedRideGroup>(`${environment.readinessTransportApiUrl}/api/admin/ride-groups/${groupId}/assign-vehicle/${vehicleId}`, {});
  }

  // Readiness
  getAllReadinessScores(): Observable<ReadinessScore[]> {
    return this.http.get<ReadinessScore[]>(`${environment.readinessTransportApiUrl}/api/admin/readiness`);
  }

  getReadinessScore(sessionId: string): Observable<ReadinessScore> {
    return this.http.get<ReadinessScore>(`${environment.apiUrl}/api/patient/readiness/${sessionId}`);
  }

  // Escalation Logs
  getEscalationLogs(): Observable<EscalationLog[]> {
    return this.http.get<EscalationLog[]>(`${environment.readinessTransportApiUrl}/api/admin/escalations`);
  }

  // User Lookup
  getUserById(id: string): Observable<{ id: string, fullName: string, email: string }> {
    return this.http.get<{ id: string, fullName: string, email: string }>(`${environment.apiUrl}/api/users/${id}`);
  }
}
