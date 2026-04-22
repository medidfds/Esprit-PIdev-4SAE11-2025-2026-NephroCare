import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-appointment-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, DatePipe],
  templateUrl: './appointment-dashboard.html',
  styleUrl: './appointment-dashboard.css',
})
export class AppointmentDashboardComponent implements OnInit {
  stats: any = {
    total: 0,
    confirmed: 0,
    cancelled: 0,
    scheduled: 0,
    rescheduled: 0
  };
  recentAppointments: any[] = [];
  loading = false;
  
  public chartData: any;
  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecent();
  }

  loadStats(): void {
    this.loading = true;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59).toISOString();

    this.appointmentService.getStats('DOC1', startOfYear, endOfYear).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          this.stats = data[0];
          this.updateChart();
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading appointment stats', err);
        this.loading = false;
      }
    });
  }

  updateChart(): void {
    this.chartData = {
      labels: ['Confirmés', 'En attente', 'Annulés', 'Reprogrammés'],
      datasets: [{
        data: [
          this.stats.confirmed || 0,
          this.stats.scheduled || 0,
          this.stats.cancelledCount || 0,
          this.stats.rescheduled || 0
        ],
        backgroundColor: ['#10b981', '#6366f1', '#ef4444', '#f59e0b'],
        hoverOffset: 4
      }]
    };
  }

  loadRecent(): void {
    this.appointmentService.getAll().subscribe({
      next: (data: any[]) => {
        // Sort by date desc and take top 5
        this.recentAppointments = data
          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
          .slice(0, 5);
      }
    });
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}
