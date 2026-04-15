import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportService } from '../../../../services/transport.service';
import { EscalationLog } from '../models/transport.model';

@Component({
  selector: 'app-escalation-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './escalation-logs.component.html',
  styleUrls: ['./escalation-logs.component.css']
})
export class EscalationLogsComponent implements OnInit {
  isLoading = true;
  logs: EscalationLog[] = [];
  errorMessage = '';
  patientNames: { [id: string]: string } = {};

  constructor(private transportService: TransportService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.errorMessage = '';
    this.transportService.getEscalationLogs().subscribe({
      next: (data) => {
        this.logs = data || [];
        this.isLoading = false;
        
        // Fetch patient names
        this.logs.forEach(log => {
          if (log.patientId && !this.patientNames[log.patientId]) {
            this.patientNames[log.patientId] = 'Loading...';
            this.transportService.getUserById(log.patientId).subscribe({
              next: (user) => this.patientNames[log.patientId] = user.fullName,
              error: () => this.patientNames[log.patientId] = 'Unknown Patient'
            });
          }
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load escalation logs.';
        this.isLoading = false;
      }
    });
  }

  getLevelLabel(level: string): string {
    switch (level) {
      case 'PATIENT_REMINDER_48H': return 'Patient Reminder (48h)';
      case 'NURSE_ALERT_24H': return 'Nurse Alert (24h)';
      case 'DOCTOR_ALERT_12H': return 'Doctor Alert (12h)';
      default: return level;
    }
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'PATIENT_REMINDER_48H': return 'level-info';
      case 'NURSE_ALERT_24H': return 'level-warning';
      case 'DOCTOR_ALERT_12H': return 'level-critical';
      default: return 'level-info';
    }
  }
}
