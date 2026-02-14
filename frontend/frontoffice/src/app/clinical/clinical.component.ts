import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClinicalService, Consultation } from '../services/clinical.service';

@Component({
  selector: 'app-clinical',
  standalone: false,
  templateUrl: './clinical.component.html',
  styleUrls: ['./clinical.component.css']
})
export class ClinicalComponent implements OnInit {
  consultations: Consultation[] = [];
  form: FormGroup;
  editingId: number | null = null;
  error: string | null = null;
  success: string | null = null;

  readonly statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  constructor(private fb: FormBuilder, private clinicalService: ClinicalService) {
    this.form = this.fb.group({
      patientId: [null, Validators.required],
      doctorId: [null, Validators.required],
      consultationDate: ['', Validators.required],
      diagnosis: ['', Validators.required],
      treatmentPlan: ['', Validators.required],
      followUpDate: [''],
      status: ['SCHEDULED']
    });
  }

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.error = null;
    this.clinicalService.getAllConsultations().subscribe({
      next: (data) => {
        this.consultations = data;
      },
      error: (err) => {
        this.error = 'Failed to load consultations: ' + err.message;
        console.error('Error loading consultations', err);
      }
    });
  }

  saveConsultation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill in all required fields';
      return;
    }

    this.error = null;
    this.success = null;

    const formValue = this.form.value;
    const consultation: Consultation = {
      patientId: Number(formValue.patientId),
      doctorId: Number(formValue.doctorId),
      consultationDate: formValue.consultationDate,
      diagnosis: formValue.diagnosis,
      treatmentPlan: formValue.treatmentPlan,
      followUpDate: formValue.followUpDate || null,
      status: formValue.status || 'SCHEDULED'
    };

    if (this.editingId != null) {
      this.clinicalService.updateConsultation(this.editingId, consultation).subscribe({
        next: () => {
          this.success = 'Consultation updated successfully!';
          this.loadConsultations();
          this.cancelEdit();
          setTimeout(() => this.success = null, 3000);
        },
        error: (err) => {
          this.error = 'Error updating consultation: ' + err.message;
          console.error('Error updating consultation', err);
        }
      });
      return;
    }

    this.clinicalService.createConsultation(consultation).subscribe({
      next: () => {
        this.success = 'Consultation created successfully!';
        this.loadConsultations();
        this.form.reset({ status: 'SCHEDULED' });
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Error creating consultation: ' + err.message;
        console.error('Error creating consultation', err);
      }
    });
  }

  editConsultation(consultation: Consultation): void {
    this.error = null;
    this.success = null;
    this.editingId = consultation.id ?? null;
    this.form.patchValue({
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      consultationDate: this.toDateTimeLocal(consultation.consultationDate),
      diagnosis: consultation.diagnosis,
      treatmentPlan: consultation.treatmentPlan,
      followUpDate: consultation.followUpDate,
      status: consultation.status
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteConsultation(id: number | undefined): void {
    if (id == null) {
      return;
    }

    if (!confirm('Are you sure you want to delete this consultation?')) {
      return;
    }

    this.error = null;
    this.clinicalService.deleteConsultation(id).subscribe({
      next: () => {
        this.success = 'Consultation deleted successfully!';
        this.loadConsultations();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Error deleting consultation: ' + err.message;
        console.error('Error deleting consultation', err);
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ status: 'SCHEDULED', patientId: null, doctorId: null });
    this.error = null;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'SCHEDULED': 'bg-info',
      'IN_PROGRESS': 'bg-warning',
      'COMPLETED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'NO_SHOW': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  private toDateTimeLocal(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
