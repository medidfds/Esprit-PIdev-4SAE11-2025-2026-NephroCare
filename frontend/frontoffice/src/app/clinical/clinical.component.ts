import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClinicalService, Consultation, MedicalHistory } from '../services/clinical.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-clinical',
  standalone: false,
  templateUrl: './clinical.component.html',
  styleUrls: ['./clinical.component.css']
})
export class ClinicalComponent implements OnInit {
  form: FormGroup;
  medicalHistoryForm: FormGroup;
  error: string | null = null;
  success: string | null = null;
  currentPatientId: number | null = null;
  currentPatientName: string | null = null;
  currentDoctorId: number | null = null;
  loadingProfile = false;
  showMedicalHistoryModal = false;
  savingMedicalHistory = false;

  constructor(
    private fb: FormBuilder,
    private clinicalService: ClinicalService,
    private keycloakService: KeycloakService
  ) {
    this.form = this.fb.group({
      patientId: [{ value: null, disabled: true }],
      consultationDate: ['', Validators.required],
      diagnosis: ['', Validators.required],
      treatmentPlan: ['', Validators.required]
    });

    this.medicalHistoryForm = this.fb.group({
      allergies: [''],
      diagnosis: [''],
      chronicConditions: [''],
      familyHistory: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUserContext();
  }

  get patientDisplayName(): string {
    return this.currentPatientName?.trim() || 'Unknown Patient';
  }

  get patientInitials(): string {
    const parts = this.patientDisplayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'PT';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  saveConsultation(): void {
    const effectivePatientId = this.currentPatientId;
    const effectiveDoctorId = this.currentDoctorId;

    if (effectivePatientId == null) {
      this.error = 'Unable to determine patient ID from your account.';
      return;
    }

    if (effectiveDoctorId == null) {
      this.error = 'Unable to determine doctor ID from your account.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please fill in all required fields';
      return;
    }

    this.error = null;
    this.success = null;

    const formValue = this.form.value;
    const consultation: Consultation = {
      patientId: effectivePatientId,
      doctorId: effectiveDoctorId,
      consultationDate: formValue.consultationDate,
      diagnosis: formValue.diagnosis,
      treatmentPlan: formValue.treatmentPlan,
      followUpDate: null,
      status: 'SCHEDULED'
    };

    this.clinicalService.createConsultation(consultation).subscribe({
      next: () => {
        this.success = 'Consultation created successfully!';
        this.form.reset({
          patientId: this.currentPatientName,
          consultationDate: '',
          diagnosis: '',
          treatmentPlan: ''
        });
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = 'Error creating consultation: ' + err.message;
        console.error('Error creating consultation', err);
      }
    });
  }

  openMedicalHistoryModal(): void {
    this.error = null;
    this.showMedicalHistoryModal = true;
  }

  closeMedicalHistoryModal(): void {
    this.showMedicalHistoryModal = false;
    this.medicalHistoryForm.reset();
  }

  saveMedicalHistory(): void {
    const effectivePatientId = this.currentPatientId;
    if (effectivePatientId == null) {
      this.error = 'Unable to determine patient ID from your account.';
      return;
    }

    const formValue = this.medicalHistoryForm.value;
    const medicalHistory: MedicalHistory = {
      userId: effectivePatientId,
      diagnosis: formValue.diagnosis || '',
      allergies: formValue.allergies || '',
      chronicConditions: formValue.chronicConditions || '',
      familyHistory: formValue.familyHistory || '',
      notes: formValue.notes || ''
    };

    this.error = null;
    this.savingMedicalHistory = true;

    this.clinicalService.createMedicalHistory(medicalHistory).subscribe({
      next: () => {
        this.success = 'Medical history created successfully!';
        this.closeMedicalHistoryModal();
        setTimeout(() => (this.success = null), 3000);
      },
      error: (err) => {
        this.error = 'Error creating medical history: ' + err.message;
        console.error('Error creating medical history', err);
      },
      complete: () => {
        this.savingMedicalHistory = false;
      }
    });
  }

  private async loadCurrentUserContext(): Promise<void> {
    this.loadingProfile = true;
    this.currentPatientId = this.extractTokenUserId();
    this.currentPatientName = this.extractTokenPatientName();
    this.currentDoctorId = this.extractTokenDoctorId();

    if (this.currentPatientId == null || !this.currentPatientName) {
      try {
        const profile = await this.keycloakService.loadUserProfile();
        if (this.currentPatientId == null) {
          this.currentPatientId = this.extractProfileUserId(profile);
        }
        if (!this.currentPatientName) {
          this.currentPatientName = this.extractProfileDisplayName(profile);
        }
      } catch (err) {
        console.warn('Unable to load profile fallback', err);
      }
    }

    this.form.patchValue({
      patientId: this.currentPatientName
    });

    this.loadingProfile = false;
  }

  private extractTokenUserId(): number | null {
    const tokenParsed: any = this.keycloakService.getKeycloakInstance()?.tokenParsed;
    if (!tokenParsed) {
      return null;
    }

    const candidates = [
      tokenParsed?.id,
      tokenParsed?.userId,
      tokenParsed?.user_id,
      tokenParsed?.patientId,
      tokenParsed?.patient_id,
      tokenParsed?.patient?.id,
      tokenParsed?.attributes?.patientId,
      tokenParsed?.attributes?.patient_id,
      tokenParsed?.preferred_username,
      tokenParsed?.username,
      tokenParsed?.email,
      tokenParsed?.uid,
      tokenParsed?.sub
    ];

    for (const value of candidates) {
      const parsed = this.parsePositiveId(value);
      if (parsed != null) {
        return parsed;
      }
    }

    return null;
  }

  private extractTokenPatientName(): string | null {
    const tokenParsed: any = this.keycloakService.getKeycloakInstance()?.tokenParsed;
    if (!tokenParsed) {
      return null;
    }

    const fullName = `${tokenParsed?.given_name ?? ''} ${tokenParsed?.family_name ?? ''}`.trim();
    const candidates = [
      tokenParsed?.name,
      fullName,
      tokenParsed?.preferred_username,
      tokenParsed?.username,
      tokenParsed?.email
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private extractTokenDoctorId(): number | null {
    const tokenParsed: any = this.keycloakService.getKeycloakInstance()?.tokenParsed;
    if (!tokenParsed) {
      return null;
    }

    const candidates = [
      tokenParsed?.doctorId,
      tokenParsed?.doctor_id,
      tokenParsed?.doctor?.id,
      tokenParsed?.attributes?.doctorId,
      tokenParsed?.attributes?.doctor_id,
      tokenParsed?.userId,
      tokenParsed?.user_id,
      tokenParsed?.uid,
      tokenParsed?.sub
    ];

    for (const value of candidates) {
      const parsed = this.parsePositiveId(value);
      if (parsed != null) {
        return parsed;
      }
    }

    return null;
  }

  private extractProfileUserId(profile: any): number | null {
    const candidates = [
      profile?.userId,
      profile?.id,
      profile?.attributes?.userId,
      profile?.attributes?.patientId,
      profile?.username,
      profile?.email
    ];

    for (const value of candidates) {
      const parsed = this.parsePositiveId(value);
      if (parsed != null) {
        return parsed;
      }
    }

    return null;
  }

  private extractProfileDisplayName(profile: any): string | null {
    const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
    const candidates = [fullName, profile?.username, profile?.email];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private parsePositiveId(value: any): number | null {
    if (typeof value === 'number') {
      return Number.isInteger(value) && value > 0 ? value : null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const parsed = this.parsePositiveId(item);
        if (parsed != null) {
          return parsed;
        }
      }
      return null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const direct = Number(trimmed);
    if (Number.isInteger(direct) && direct > 0) {
      return direct;
    }

    const match = trimmed.match(/\d+/);
    if (!match) {
      return null;
    }

    const extracted = Number(match[0]);
    return Number.isInteger(extracted) && extracted > 0 ? extracted : null;
  }
}
