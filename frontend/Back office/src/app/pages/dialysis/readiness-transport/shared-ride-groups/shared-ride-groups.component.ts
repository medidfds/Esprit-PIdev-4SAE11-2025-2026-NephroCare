import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportService } from '../../../../services/transport.service';
import { SharedRideGroup, Vehicle } from '../models/transport.model';

@Component({
  selector: 'app-shared-ride-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-ride-groups.component.html',
  styleUrls: ['./shared-ride-groups.component.css'],   // ← add
  encapsulation: ViewEncapsulation.None
})
export class SharedRideGroupsComponent implements OnInit {
  isLoading = true;
  groups: SharedRideGroup[] = [];
  vehicles: Vehicle[] = [];
  selectedVehicleId: { [groupId: string]: string } = {};
  patientNames: { [id: string]: string } = {};
  errorMessage: { [groupId: string]: string | null } = {};
  groupToDelete: SharedRideGroup | null = null;

  constructor(private transportService: TransportService) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadActiveVehicles();
  }

  loadGroups() {
    this.isLoading = true;
    this.transportService.getSharedRideGroups().subscribe({
      next: (data) => {
        this.groups = data || [];
        this.isLoading = false;
        
        // Fetch patient names
        this.groups.forEach(group => {
          group.transportRequests?.forEach(req => {
            if (req.patientId && !this.patientNames[req.patientId]) {
              this.patientNames[req.patientId] = 'Loading...';
              this.transportService.getUserById(req.patientId).subscribe({
                next: (user) => this.patientNames[req.patientId] = user.fullName,
                error: () => this.patientNames[req.patientId] = 'Unknown Patient'
              });
            }
          });
        });
      },
      error: (err) => {
        console.error('Failed to load ride groups', err);
        this.isLoading = false;
      }
    });
  }

  loadActiveVehicles() {
    this.transportService.getActiveVehicles().subscribe({
      next: (data) => this.vehicles = data,
      error: (err) => console.error('Failed to load vehicles', err)
    });
  }

  proposeGroups() {
    this.isLoading = true;
    this.transportService.proposeRideGroups().subscribe({
      next: () => this.loadGroups(),
      error: (err) => {
        console.error('Failed to propose groups', err);
        this.isLoading = false;
      }
    });
  }

  validateGroup(id: string) {
    if (!id) return;
    this.transportService.validateRideGroup(id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => console.error('Failed to validate group', err)
    });
  }

  rejectGroup(id: string) {
    if (!id) return;
    this.transportService.rejectRideGroup(id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => console.error('Failed to reject group', err)
    });
  }

  assignVehicle(groupId: string) {
    this.errorMessage[groupId] = null;
    const vehicleId = this.selectedVehicleId[groupId];
    if (!groupId || !vehicleId) return;
    this.transportService.assignVehicleToGroup(groupId, vehicleId).subscribe({
      next: () => this.loadGroups(),
      error: (err) => {
        console.error('Failed to assign vehicle', err);
        this.errorMessage[groupId] = err.error?.message || 'Failed to assign vehicle. Please check vehicle availability and constraints.';
      }
    });
  }

  isVehicleValid(v: Vehicle, group: SharedRideGroup): boolean {
    if (v.capacity < (group.memberCount || 0)) return false;
    if (group.requiresWheelchair && !v.wheelchairSupported) return false;
    return true;
  }

  getVehicleDisabledReason(v: Vehicle, group: SharedRideGroup): string {
    if (v.capacity < (group.memberCount || 0)) return ' (Too small)';
    if (group.requiresWheelchair && !v.wheelchairSupported) return ' (No wheelchair)';
    return '';
  }

  showDeleteModal(group: SharedRideGroup) {
    this.groupToDelete = group;
  }

  closeDeleteModal() {
    this.groupToDelete = null;
  }

  confirmDelete() {
    if (!this.groupToDelete || !this.groupToDelete.id) return;
    
    const groupId = this.groupToDelete.id;
    this.closeDeleteModal();
    this.isLoading = true;
    
    this.transportService.deleteRideGroup(groupId).subscribe({
      next: () => this.loadGroups(),
      error: (err) => {
        console.error('Failed to delete ride group', err);
        this.isLoading = false;
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
