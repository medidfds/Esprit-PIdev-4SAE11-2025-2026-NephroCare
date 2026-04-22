import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService, Alert } from '../../services/alerts.service';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, BaseChartDirective],
  templateUrl: './alert-dashboard.component.html',
  styleUrls: ['./alert-dashboard.component.css']
})
export class AlertDashboardComponent implements OnInit {

  recentCritical: Alert[] = [];
  stats: any = {
    total: 0,
    resolved: 0,
    pending: 0
  };
  chartData: any;
  loading = false;

  constructor(
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAll();
    this.loadDashboardData();
    this.loadAlertStats();
    
    // Auto-refresh alerts every 5 seconds
    setInterval(() => {
      this.loadAlerts();
    }, 5000);
  }

  loadAll() {
    this.loadAlerts();
  }

  // 🚨 RECENT ALERTS
  loadAlerts(): void {
    this.loading = true;
    this.alertService.getRecentCritical().subscribe({
      next: (data) => {
        this.recentCritical = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
  loadDashboardData(): void {
    // Note: WebSocket disabled - using polling instead
    // To enable WebSocket, configure proxy or point to backend URL directly
    // this.socketService.connect();
    
    // Listen for new alerts via WebSocket (if re-enabled)
    // this.socketService.alerts$.subscribe(alert => {
    //   console.log('🚨 Nouvelle alerte reçue', alert);
    //   this.recentCritical.unshift(alert);
    //   if (this.recentCritical.length > 10) {
    //     this.recentCritical.pop();
    //   }
    // });
  }

  // 📊 ALERT STATISTICS
  loadAlertStats() {
    this.alertService.getAll().subscribe({
      next: (alerts: Alert[]) => {
        const total = alerts.length;
        const resolved = alerts.filter(a => a.resolved).length;
        const pending = total - resolved;

        this.stats = { total, resolved, pending };

        // Count by Severity
        const counts = {
          CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
          HIGH: alerts.filter(a => a.severity === 'HIGH').length,
          MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
          LOW: alerts.filter(a => a.severity === 'LOW').length
        };

        this.chartData = {
          labels: ['Critique', 'Elevée', 'Moyenne', 'Faible'],
          datasets: [{
            data: [counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
            hoverOffset: 4
          }]
        };
      },
      error: err => console.error('Alert stats error', err)
    });
  }

  goToAlerts(): void {
    this.router.navigate(['/alerts']);
  }
}