import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../../services/alert.service';

@Component({
  selector: 'app-my-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ma-container">
      <div class="ma-header">
        <h2 class="ma-title">My Clinical Alerts</h2>
        <p class="ma-subtitle">Important notifications regarding your treatment adequacy and safety.</p>
      </div>

      <div class="ma-list">
        @for (alert of alerts; track alert.id) {
          <div class="ma-item" [class.ma-item--critical]="alert.severity === 'CRITICAL'">
            <div class="ma-icon">
              <i class="bi" [class]="alert.severity === 'CRITICAL' ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill'"></i>
            </div>
            <div class="ma-content">
              <div class="ma-meta">
                <span class="ma-category">{{ alert.category }}</span>
                <span class="ma-date">{{ alert.createdAt | date:'MMM d, HH:mm' }}</span>
              </div>
              <h4 class="ma-subject">{{ alert.title }}</h4>
              <p class="ma-message">{{ alert.message }}</p>
            </div>
          </div>
        } @empty {
          <div class="ma-empty">
            <i class="bi bi-check-circle-fill"></i>
            <h3>All Clear</h3>
            <p>You have no active clinical or readiness alerts at this time.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ma-container { padding: 1rem; }
    .ma-header { margin-bottom: 2rem; }
    .ma-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
    .ma-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; }
    
    .ma-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .ma-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .ma-item--critical { border-left: 4px solid #ef4444; }
    
    .ma-icon {
      font-size: 1.5rem;
      color: #f59e0b;
    }
    .ma-item--critical .ma-icon { color: #ef4444; }
    
    .ma-content { flex: 1; }
    .ma-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .ma-category { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #3b82f6; }
    .ma-date { font-size: 0.75rem; color: #94a3b8; }
    
    .ma-subject { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0; }
    .ma-message { font-size: 0.8125rem; color: #64748b; line-height: 1.5; margin: 0; }
    
    .ma-empty {
      padding: 4rem 2rem;
      text-align: center;
      background: #f8fafc;
      border-radius: 1.5rem;
      border: 2px dashed #e2e8f0;
    }
    .ma-empty i { font-size: 3rem; color: #22c55e; margin-bottom: 1rem; display: block; }
    .ma-empty h3 { color: #1e293b; font-weight: 700; margin-bottom: 0.5rem; }
    .ma-empty p { font-size: 0.875rem; color: #64748b; }
  `]
})
export class MyAlertsComponent implements OnInit {
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.getMyOpenAlerts().subscribe((data: Alert[]) => {
      this.alerts = data;
    });
  }
}
