import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClinicalService, MedicalHistory } from '../../services/clinical.service';

@Component({
  selector: 'app-clinical',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clinical.component.html',
  styleUrls: ['./clinical.component.css']
})
export class ClinicalComponent implements OnInit {
  medicalHistories: MedicalHistory[] = [];
  form: FormGroup;
  editingId: number | null = null;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private clinicalService: ClinicalService) {
    this.form = this.fb.group({
      userId: [null],
      diagnosis: [''],
      allergies: [''],
      chronicConditions: [''],
      familyHistory: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadMedicalHistories();
  }

  loadMedicalHistories(): void {
    this.error = null;
    this.clinicalService.getAllMedicalHistories().subscribe({
      next: (data) => {
        this.medicalHistories = data;
      },
      error: (err) => {
        this.error = 'Failed to load medical histories: ' + err.message;
        console.error('Error loading medical histories', err);
      }
    });
  }

  saveMedicalHistory(): void {
    // When creating new, userId is required. When editing, it's optional.
    if (this.editingId == null) {
      // Creating new - require userId
      if (!this.form.get('userId')?.value) {
        this.error = 'User ID is required when creating a new medical history';
        return;
      }
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill in all required fields';
      return;
    }

    this.error = null;
    this.success = null;

    const formValue = this.form.value;
    const medicalHistory: MedicalHistory = {
      userId: this.editingId 
        ? (this.medicalHistories.find(m => m.id === this.editingId)?.userId || Number(formValue.userId)) 
        : Number(formValue.userId),
      diagnosis: formValue.diagnosis || '',
      allergies: formValue.allergies || '',
      chronicConditions: formValue.chronicConditions || '',
      familyHistory: formValue.familyHistory || '',
      notes: formValue.notes || ''
    };

    if (this.editingId != null) {
      this.clinicalService.updateMedicalHistory(this.editingId, medicalHistory).subscribe({
        next: () => {
          this.success = 'Medical history updated successfully!';
          this.loadMedicalHistories();
          this.cancelEdit();
          setTimeout(() => this.success = null, 3000);
        },
        error: (err) => {
          this.error = 'Error updating medical history: ' + err.message;
          console.error('Error updating medical history', err);
        }
      });
      return;
    }

    this.clinicalService.createMedicalHistory(medicalHistory).subscribe({
      next: () => {
        this.success = 'Medical history created successfully!';
        this.loadMedicalHistories();
        this.form.reset();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Error creating medical history: ' + err.message;
        console.error('Error creating medical history', err);
      }
    });
  }

  editMedicalHistory(medicalHistory: MedicalHistory): void {
    this.error = null;
    this.success = null;
    this.editingId = medicalHistory.id ?? null;
    this.form.patchValue({
      userId: medicalHistory.userId,
      diagnosis: medicalHistory.diagnosis || '',
      allergies: medicalHistory.allergies || '',
      chronicConditions: medicalHistory.chronicConditions || '',
      familyHistory: medicalHistory.familyHistory || '',
      notes: medicalHistory.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteMedicalHistory(id: number | undefined): void {
    if (id == null) {
      return;
    }

    if (!confirm('Are you sure you want to delete this medical history?')) {
      return;
    }

    this.error = null;
    this.clinicalService.deleteMedicalHistory(id).subscribe({
      next: () => {
        this.success = 'Medical history deleted successfully!';
        this.loadMedicalHistories();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = 'Error deleting medical history: ' + err.message;
        console.error('Error deleting medical history', err);
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
    this.error = null;
  }
}
