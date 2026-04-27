import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Medication {
  id?: string;
  medicationName: string;
  dosage?: string;
  frequency?: number;
  route?: string;
  duration?: number;
  quantity: number;
  startDate?: string;
  endDate?: string;
  userId?:  string;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {

  private baseUrl = 'http://localhost:30070/pharmacy/api/medications';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Medication[]> {
    return this.http.get<Medication[]>(this.baseUrl);
  }

  getById(id: string): Observable<Medication> {
    return this.http.get<Medication>(`${this.baseUrl}/${id}`);
  }
   getByUser(userId: string): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.baseUrl}/user/${userId}`);
  }
}