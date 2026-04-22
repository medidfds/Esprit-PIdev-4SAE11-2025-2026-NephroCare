import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportPreview {
  hospitalizationId: number;
  patientName: string;
  admissionDate: string;
  status: string;
  roomNumber?: string;
  duration: number;
  preview: boolean;
}

export interface ReportListItem {
  id: string;
  type: string;
  filename: string;
  createdAt: string;
  size: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  private readonly apiUrl = environment.pdfGeneratorUrl || 'http://localhost:4000';

  constructor(private http: HttpClient) {}

  /**
   * Generate a PDF report for a hospitalization
   * @param hospitalizationId The ID of the hospitalization
   * @param format The report format ('basic' or 'advanced')
   * @returns Observable<Blob> - The PDF file as a blob
   */
  generateHospitalizationReport(hospitalizationId: number, format: 'basic' | 'advanced' = 'advanced'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/reports/hospitalization/${hospitalizationId}`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Get a preview of the report data
   * @param hospitalizationId The ID of the hospitalization
   * @returns Observable<ReportPreview> - Preview information
   */
  getReportPreview(hospitalizationId: number): Observable<ReportPreview> {
    return this.http.get<ReportPreview>(`${this.apiUrl}/reports/hospitalization/${hospitalizationId}/preview`);
  }

  /**
   * Get a list of generated reports
   * @returns Observable<{reports: ReportListItem[]}> - List of reports
   */
  getReportsList(): Observable<{reports: ReportListItem[]}> {
    return this.http.get<{reports: ReportListItem[]}>(`${this.apiUrl}/reports/list`);
  }

  /**
   * Download a PDF report with a specific filename
   * @param hospitalizationId The ID of the hospitalization
   * @param format The report format
   * @param filename Optional custom filename
   */
  downloadHospitalizationReport(
    hospitalizationId: number,
    format: 'basic' | 'advanced' = 'advanced',
    filename?: string
  ): void {
    this.generateHospitalizationReport(hospitalizationId, format).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const defaultFilename = `hospitalization_report_${hospitalizationId}_${Date.now()}.pdf`;
      link.download = filename || defaultFilename;

      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  /**
   * Open a PDF report in a new tab
   * @param hospitalizationId The ID of the hospitalization
   * @param format The report format
   */
  openHospitalizationReport(hospitalizationId: number, format: 'basic' | 'advanced' = 'advanced'): void {
    const url = `${this.apiUrl}/reports/hospitalization/${hospitalizationId}?format=${format}`;
    window.open(url, '_blank');
  }
}