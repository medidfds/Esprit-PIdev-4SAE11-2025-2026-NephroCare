import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportService } from '../../../../services/transport.service';
import { ReadinessScore } from '../models/transport.model';


@Component({
  selector: 'app-readiness-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './readiness-monitoring.component.html',
  styleUrls: ['./readiness-monitoring.component.css'],  // ← add
  encapsulation: ViewEncapsulation.None
})
export class ReadinessMonitoringComponent implements OnInit {
  isLoading = true;
  readinessList: ReadinessScore[] = [];

  constructor(private transportService: TransportService) {}

  ngOnInit(): void {
    this.loadReadinessScores();
  }

  loadReadinessScores() {
    this.isLoading = true;

    this.transportService.getAllReadinessScores().subscribe({
      next: (results: ReadinessScore[]) => {
        this.readinessList = results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading complete readiness grid', err);
        this.isLoading = false;
        this.readinessList = [];
      }
    });
  }

  formatStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    return status.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
  }
}
