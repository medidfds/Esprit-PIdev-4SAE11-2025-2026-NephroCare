import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransportService } from '../../../../services/transport.service';
import { TransportRequest } from '../models/transport.model';

@Component({
  selector: 'app-pending-transport-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-transport-requests.component.html',
  styleUrls: ['./pending-transport-requests.component.css'],  // ← add
  encapsulation: ViewEncapsulation.None
})
export class PendingTransportRequestsComponent implements OnInit {
  isLoading = true;
  requests: TransportRequest[] = [];
  processingId: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  patientNames: { [id: string]: string } = {};

  constructor(private transportService: TransportService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.transportService.getPendingRequests().subscribe({
      next: (data) => {
        this.requests = data || [];
        this.isLoading = false;
        
        // Fetch patient names
        this.requests.forEach(req => {
          if (req.patientId && !this.patientNames[req.patientId]) {
            this.patientNames[req.patientId] = 'Loading...';
            this.transportService.getUserById(req.patientId).subscribe({
              next: (user) => this.patientNames[req.patientId] = user.fullName,
              error: () => this.patientNames[req.patientId] = 'Unknown Patient'
            });
          }
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load pending requests.';
        this.isLoading = false;
      }
    });
  }

  approve(id?: string) {
    if (!id) return;
    const comment = prompt("Enter approval comment (optional):");
    if (comment === null) return; // User cancelled

    this.processingId = id;
    this.clearMessages();
    this.processApprove(id, comment);
  }

  validateRequest(id?: string) {
    this.approve(id);
  }

  processApprove(id: string, comment: string | null) {
    this.transportService.approveRequest(id, comment || '').subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== id);
        this.successMessage = 'Request approved successfully.';
        this.processingId = null;
      },
      error: () => {
        this.errorMessage = 'Failed to approve request.';
        this.processingId = null;
      }
    });
  }

  reject(id?: string) {
    if (!id) return;
    const reason = prompt("Enter reason for rejection (optional):");
    if (reason === null) return; // User cancelled

    this.processingId = id;
    this.clearMessages();

    this.transportService.rejectRequest(id, reason).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== id);
        this.successMessage = 'Request rejected successfully.';
        this.processingId = null;
      },
      error: () => {
         this.errorMessage = 'Failed to reject request.';
         this.processingId = null;
      }
    });
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  viewDetails(req: any) {
    // stub for redesign interaction
    console.log('Viewing details for:', req);
  }

  formatStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    return status.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
  }
}
