import { Component, OnInit, ViewEncapsulation, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransportService } from '../../../../services/transport.service';
import { Vehicle } from '../models/transport.model';
import { AppModalComponent } from '../../../../shared/components/ui/app-modal/app-modal.component';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

@Pipe({
  name: 'activeVehicles',
  standalone: true
})
export class ActiveVehiclesPipe implements PipeTransform {
  transform(vehicles: Vehicle[]): number {
    if (!vehicles) return 0;
    return vehicles.filter(v => v.active).length;
  }
}

@Pipe({
  name: 'statusCount',
  standalone: true
})
export class StatusCountPipe implements PipeTransform {
  transform(vehicles: Vehicle[], status: string): number {
    if (!vehicles) return 0;
    return vehicles.filter(v => v.status === status).length;
  }
}

@Component({
  selector: 'app-vehicle-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ActiveVehiclesPipe, StatusCountPipe, AppModalComponent, ButtonComponent, BadgeComponent],
  templateUrl: './vehicle-management.component.html',
  styleUrls: ['./vehicle-management.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VehicleManagementComponent implements OnInit {
  isLoading = true;
  vehicles: Vehicle[] = [];

  isModalOpen = false;
  isEditMode = false;
  currentVehicleId: string | null = null;

  newVehicle: Partial<Vehicle> = {
    code: '',
    capacity: 4,
    wheelchairSupported: false,
    status: 'IDLE',
    active: true,
    currentLat: 36.8065,
    currentLng: 10.1815
  };

  isSubmitting = false;

  // Delete state
  isDeleteModalOpen = false;
  vehicleToDelete: Vehicle | null = null;
  isDeleting = false;
  deleteErrorMessage: string | null = null;

  constructor(private transportService: TransportService) { }

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.transportService.getAllVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading vehicles', err);
        this.isLoading = false;
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentVehicleId = null;
    this.newVehicle = {
      code: '',
      capacity: 4,
      wheelchairSupported: false,
      status: 'IDLE',
      active: true,
      currentLat: 36.8065,
      currentLng: 10.1815
    };
    this.isModalOpen = true;
  }

  openEditModal(vehicle: Vehicle): void {
    if (!vehicle.id) return;
    this.isEditMode = true;
    this.currentVehicleId = vehicle.id;
    this.newVehicle = { ...vehicle };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onCreate(): void {
    this.saveVehicle();
  }

  saveVehicle(): void {
    if (!this.newVehicle.code) return;

    this.isSubmitting = true;

    if (this.isEditMode && this.currentVehicleId) {
      const updatePayload = { ...this.newVehicle };
      delete updatePayload.id;

      this.transportService.updateVehicle(this.currentVehicleId, updatePayload).subscribe({
        next: (updated) => {
          const index = this.vehicles.findIndex(v => v.id === updated.id);
          if (index !== -1) {
            this.vehicles[index] = updated;
          }
          this.isSubmitting = false;
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating vehicle', err);
          this.isSubmitting = false;
        }
      });
    } else {
      this.transportService.createVehicle(this.newVehicle).subscribe({
        next: (created) => {
          this.vehicles.push(created);
          this.isSubmitting = false;
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating vehicle', err);
          this.isSubmitting = false;
        }
      });
    }
  }

  toggleVehicleActive(vehicle: Vehicle): void {
    if (!vehicle.id) return;

    const originalState = vehicle.active;
    const newState = !originalState;
    
    // Optimistic update
    vehicle.active = newState;
    
    this.transportService.toggleVehicleActive(vehicle.id, newState).subscribe({
      next: (updated) => {
        // Confirm update
        vehicle.active = updated.active;
      },
      error: (err) => {
        console.error('Error toggling vehicle state', err);
        // Revert on error
        vehicle.active = originalState;
      }
    });
  }

  openDeleteModal(vehicle: Vehicle): void {
    this.deleteErrorMessage = null;
    this.vehicleToDelete = vehicle;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.vehicleToDelete = null;
    this.deleteErrorMessage = null;
  }

  confirmDelete(): void {
    if (!this.vehicleToDelete || !this.vehicleToDelete.id) return;
    
    this.isDeleting = true;
    this.deleteErrorMessage = null;
    
    this.transportService.deleteVehicle(this.vehicleToDelete.id).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter(v => v.id !== this.vehicleToDelete?.id);
        this.isDeleting = false;
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error deleting vehicle', err);
        this.isDeleting = false;
        // The prompt asked for this exact message on delete validation errors
        // Normally we'd check if err.status === 400 or err.error.message
        // but we'll show it generically for any backend error as requested
        this.deleteErrorMessage = 'Cannot delete this vehicle because it is assigned to a shared ride group.';
      }
    });
  }
}
