import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { PharmacyService, Medication } from '../../services/pharmacy.service';
import { PrescriptionService, Prescription, PrescriptionStatus } from '../../services/prescription.service';
import { MedicationRoute } from '../../services/medication-route.enum';
import { NotificationService } from '../../services/notification.service'; 

@Component({
  selector: 'app-pharmacy',
  templateUrl: './pharmacy.component.html',
  styleUrls: ['./pharmacy.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  providers: [DatePipe]
})
export class PharmacyComponent implements OnInit {

  // ── Tabs ──────────────────────────────────────
  activeTab: 'medications' | 'prescriptions' = 'medications';

  // ── Medications ───────────────────────────────
  medications: Medication[] = [];
  medicationForm!: FormGroup;
  selectedMedId: string | null = null;

  // ── Prescriptions ─────────────────────────────
  prescriptions: Prescription[] = [];
  prescriptionForm!: FormGroup;
  selectedPrescriptionId: string | null = null;
  viewingPrescription: Prescription | null = null;

  // ── Shared ────────────────────────────────────
  routes = Object.values(MedicationRoute);
  statuses: PrescriptionStatus[] = ['PENDING','APPROVED','DISPENSED','COMPLETED','CANCELLED'];

  constructor(
    private fb: FormBuilder,
    private pharmacyService: PharmacyService,
    private prescriptionService: PrescriptionService,
    private notif: NotificationService  
  ) {}

  ngOnInit(): void {
    this.initMedicationForm();
    this.initPrescriptionForm();
    this.loadMedications();
    this.loadPrescriptions();
  }

  // ════════════════════════════════════════════════
  // MEDICATION
  // ════════════════════════════════════════════════

  initMedicationForm(): void {
    this.medicationForm = this.fb.group({
      medicationName: ['', Validators.required],
      dosage:         [''],
      frequency:      [null],
      route:          [null],
      duration:       [null],
      quantity:       [0, [Validators.required, Validators.min(0)]],
      startDate:      [''],
      endDate:        ['', Validators.required]
    });
  }

  loadMedications(): void {
    this.pharmacyService.getAll().subscribe({
      next: data => {
        this.medications = data;

     
        const outStock = data.filter(m => m.quantity === 0);
        if (outStock.length > 0) {
          this.notif.error(
            'Out of Stock!',
            `${outStock.length} medication(s) are completely out of stock`
          );
        }

        
        const lowStock = data.filter(m => m.quantity > 0 && m.quantity < 10);
        if (lowStock.length > 0) {
          this.notif.warning(
            'Low Stock Alert',
            `${lowStock.length} medication(s) have less than 10 units left`
          );
        }
      },
      error: () => {
        this.notif.error('Load Failed', 'Could not load medications from server');
      }
    });
  }

  submitMedication(): void {
    if (this.medicationForm.invalid) return;
    const med: Medication = this.medicationForm.value;

    if (this.selectedMedId) {
      this.pharmacyService.update(this.selectedMedId, med).subscribe({
        next: () => {
          this.notif.success('Updated!', `${med.medicationName} has been updated`);
          this.resetMedicationForm();
        },
        error: () => {
          this.notif.error('Update Failed', `Could not update ${med.medicationName}`);
        }
      });
    } else {
      this.pharmacyService.create(med).subscribe({
        next: () => {
          this.notif.success('Medication Added!', `${med.medicationName} added to pharmacy`);
          this.resetMedicationForm();
        },
        error: () => {
          this.notif.error('Create Failed', `Could not add ${med.medicationName}`);
        }
      });
    }
  }

  editMedication(med: Medication): void {
    this.selectedMedId = med.id!;
    this.medicationForm.patchValue(med);
    this.activeTab = 'medications';
    this.notif.info('Edit Mode', `Now editing: ${med.medicationName}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteMedication(id?: string): void {
    if (!id) return;
    const med = this.medications.find(m => m.id === id);
    if (confirm('Delete this medication?')) {
      this.pharmacyService.delete(id).subscribe({
        next: () => {
          this.notif.success('Deleted!', `${med?.medicationName || 'Medication'} has been deleted`);
          this.loadMedications();
        },
        error: () => {
          this.notif.error('Delete Failed', 'Could not delete this medication');
        }
      });
    }
  }

  resetMedicationForm(): void {
    this.medicationForm.reset();
    this.selectedMedId = null;
    this.loadMedications();
  }

  // ════════════════════════════════════════════════
  // PRESCRIPTION
  // ════════════════════════════════════════════════

  initPrescriptionForm(): void {
    this.prescriptionForm = this.fb.group({
      prescriptionDate: ['', Validators.required],
      validUntil:       ['', Validators.required],
      instructions:     [''],
      consultationId:   [''],
      userId:           ['', Validators.required],
      prescribedBy:     ['', Validators.required],
      status:           ['PENDING'],
      medications:      this.fb.array([])
    });
  }

  get medicationsArray(): FormArray {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  newMedicationGroup(data?: any): FormGroup {
    return this.fb.group({
      medicationName: [data?.medicationName || '', Validators.required],
      dosage:         [data?.dosage || ''],
      frequency:      [data?.frequency || null],
      route:          [data?.route || null],
      duration:       [data?.duration || null],
      quantity:       [data?.quantity || 0, [Validators.required, Validators.min(0)]],
      startDate:      [data?.startDate || ''],
      endDate:        [data?.endDate || '']
    });
  }

  addMedication(): void {
    this.medicationsArray.push(this.newMedicationGroup());
  }

  removeMedication(index: number): void {
    this.medicationsArray.removeAt(index);
  }

  loadPrescriptions(): void {
    this.prescriptionService.getAll().subscribe({
      next: data => {
        this.prescriptions = data;

        
        const expired = data.filter(p => this.isExpired(p.validUntil));
        if (expired.length > 0) {
          this.notif.warning(
            'Expired Prescriptions',
            `${expired.length} prescription(s) have expired`
          );
        }

        const pending = data.filter(p => p.status === 'PENDING');
        if (pending.length > 0) {
          this.notif.info(
            'Pending Prescriptions',
            `${pending.length} prescription(s) waiting for approval`
          );
        }
      },
      error: () => {
        this.notif.error('Load Failed', 'Could not load prescriptions from server');
      }
    });
  }

  submitPrescription(): void {
    if (this.prescriptionForm.invalid) return;
    const prescription: Prescription = this.prescriptionForm.value;

    if (this.selectedPrescriptionId) {
      this.prescriptionService.delete(this.selectedPrescriptionId).subscribe({
        next: () => {
          this.prescriptionService.create(prescription).subscribe({
            next: () => {
              this.notif.success('Prescription Updated!', 'Prescription updated successfully');
              this.resetPrescriptionForm();
            },
            error: () => {
              this.notif.error('Update Failed', 'Could not update the prescription');
            }
          });
        },
        error: () => {
          this.notif.error('Update Failed', 'Could not update the prescription');
        }
      });
    } else {
      this.prescriptionService.create(prescription).subscribe({
        next: () => {
          this.notif.success('Prescription Created!', 'New prescription has been saved');
          this.resetPrescriptionForm();
        },
        error: () => {
          this.notif.error('Create Failed', 'Could not create the prescription');
        }
      });
    }
  }

  editPrescription(p: Prescription): void {
    this.selectedPrescriptionId = p.id!;

    while (this.medicationsArray.length) {
      this.medicationsArray.removeAt(0);
    }

    this.prescriptionForm.patchValue({
      prescriptionDate: p.prescriptionDate,
      validUntil:       p.validUntil,
      instructions:     p.instructions,
      consultationId:   p.consultationId,
      userId:           p.userId,
      prescribedBy:     p.prescribedBy,
      status:           p.status
    });

    if (p.medications && p.medications.length > 0) {
      p.medications.forEach(med => {
        this.medicationsArray.push(this.newMedicationGroup(med));
      });
    }

    this.notif.info('Edit Mode', `Editing prescription from Dr. ${p.prescribedBy || 'Unknown'}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateStatus(id: string, status: PrescriptionStatus): void {
    this.prescriptionService.updateStatus(id, status).subscribe({
      next: () => {
        this.notif.success('Status Updated!', `Prescription is now ${status}`);
        this.loadPrescriptions();
      },
      error: () => {
        this.notif.error('Update Failed', 'Could not update prescription status');
      }
    });
  }

  deletePrescription(id?: string): void {
    if (!id) return;
    if (confirm('Delete this prescription?')) {
      this.prescriptionService.delete(id).subscribe({
        next: () => {
          this.notif.success('Deleted!', 'Prescription has been deleted');
          this.loadPrescriptions();
        },
        error: () => {
          this.notif.error('Delete Failed', 'Could not delete this prescription');
        }
      });
    }
  }

  viewPrescription(p: Prescription): void {
    this.viewingPrescription = p;
  }

  closeView(): void {
    this.viewingPrescription = null;
  }

  resetPrescriptionForm(): void {
    this.prescriptionForm.reset({ status: 'PENDING' });
    while (this.medicationsArray.length) this.medicationsArray.removeAt(0);
    this.selectedPrescriptionId = null;
    this.loadPrescriptions();
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  statusClass(status?: string): string {
    const map: Record<string, string> = {
      PENDING:   'badge-pending',
      APPROVED:  'badge-approved',
      DISPENSED: 'badge-dispensed',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled'
    };
    return map[status || ''] || '';
  }

  isExpired(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }
}