import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticResultService {
  // Gateway route for diagnostic-service: /diagnostic/** with stripPrefix(1)
  private baseUrl = 'http://localhost:8070/diagnostic/api/diagnostic-results';

  constructor(private http: HttpClient) {}

  getAllResults(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getResultById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getResultsByOrderId(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/order/${orderId}`);
  }

  createResult(result: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, result);
  }

  updateResult(id: string, result: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, result);
  }

  deleteResult(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
