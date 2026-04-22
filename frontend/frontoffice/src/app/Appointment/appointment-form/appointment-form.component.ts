import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { KeycloakAdminService, KeycloakUser } from '../../services/keycloak-admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="form-card">
        <div class="form-header">
          <div class="header-icon">📅</div>
          <h2 class="form-title">Nouveau Rendez-vous</h2>
          <p class="form-subtitle">Planifiez une consultation pour un patient</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="appointment-form">
          <div class="form-grid">
            
            <!-- Patient -->
            <div class="form-field">
              <label class="field-label">Patient <span class="req">*</span></label>
              <div class="select-wrapper">
                <select class="form-input" formControlName="patientId" (change)="onPatientChange()">
                  <option value="" disabled selected>Sélectionnez un patient...</option>
                  <option *ngFor="let p of patients" [value]="p.id">
                    {{ p.firstName }} {{ p.lastName }} ({{ p.username }})
                  </option>
                </select>
              </div>
              <div *ngIf="isInvalid('patientId')" class="error-msg">Le patient est obligatoire.</div>
            </div>

            <!-- Médecin -->
            <div class="form-field">
              <label class="field-label">Médecin <span class="req">*</span></label>
              <div class="select-wrapper">
                <select class="form-input" formControlName="medecinId" (change)="onDoctorChange()">
                  <option value="" disabled selected>Sélectionnez un médecin...</option>
                  <option *ngFor="let d of doctors" [value]="d.id">
                    Dr. {{ d.firstName }} {{ d.lastName }}
                  </option>
                </select>
              </div>
              <div *ngIf="isInvalid('medecinId')" class="error-msg">Le médecin est obligatoire.</div>
            </div>

            <div class="form-row">
              <!-- Date & Heure -->
              <div class="form-field flex-2">
                <label class="field-label">Date et Heure <span class="req">*</span></label>
                <input type="datetime-local" class="form-input" formControlName="dateTime" [min]="minDate">
                <div *ngIf="isInvalid('dateTime')" class="error-msg">Date et heure requises.</div>
              </div>

              <!-- Durée -->
              <div class="form-field flex-1">
                <label class="field-label">Durée (min) <span class="req">*</span></label>
                <input type="number" class="form-input" formControlName="durationMinutes" min="1">
              </div>
            </div>

            <!-- Type -->
            <div class="form-field">
              <label class="field-label">Type de Consultation <span class="req">*</span></label>
              <div class="select-wrapper">
                <select class="form-input" formControlName="type">
                  <option value="CONSULTATION">CONSULTATION</option>
                  <option value="POST_TRANSPLANT">POST_TRANSPLANT</option>
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="BIOPSY">BIOPSY</option>
                  <option value="DIAGNOSTIC">DIAGNOSTIC</option>
                </select>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-field">
              <label class="field-label">Notes (Optionnel)</label>
              <textarea class="form-textarea" formControlName="notes" rows="4" placeholder="Observations, antécédents, remarques..."></textarea>
            </div>

          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="cancel()">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
              <span *ngIf="!loading">🚀 Enregistrer le RDV</span>
              <span *ngIf="loading">Traitement...</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 3rem 1.5rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      min-height: calc(100vh - 80px);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: 'Inter', sans-serif;
    }
    .form-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      width: 100%;
      max-width: 700px;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 3rem;
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .form-header { text-align: center; margin-bottom: 2.5rem; }
    .header-icon { font-size: 3rem; margin-bottom: 1rem; }
    .form-title { font-size: 2rem; font-weight: 800; color: #064e3b; margin: 0; letter-spacing: -0.5px; }
    .form-subtitle { color: #64748b; font-size: 1rem; margin-top: 0.5rem; }

    .form-field { margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 1.5rem; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .field-label {
      display: block;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .req { color: #ef4444; }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.8rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.3s;
    }
    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #10b981;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.1);
    }
    .select-wrapper { position: relative; }
    .select-wrapper::after {
      content: '▼';
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: #64748b;
      pointer-events: none;
    }
    .form-input { appearance: none; }

    .error-msg { color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem; animation: shake 0.4s; }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; }
    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(16, 185, 129, 0.3); filter: brightness(1.1); }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; opacity: 0.7; }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: none;
      padding: 1rem 1.5rem;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: #e2e8f0; color: #1e293b; }
  `]
})
export class AppointmentFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  patients: KeycloakUser[] = [];
  doctors: KeycloakUser[] = [];
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private keycloakAdmin: KeycloakAdminService,
    private router: Router
  ) {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      patientNom: [''],
      patientMatricule: [''],
      medecinId: ['', Validators.required],
      medecinNom: [''],
      type: ['CONSULTATION', Validators.required],
      dateTime: ['', Validators.required],
      durationMinutes: [30, [Validators.required, Validators.min(1)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.setMinDate();
  }

  loadUsers(): void {
    this.keycloakAdmin.getUsersByRole('patient').subscribe(data => this.patients = data || []);
    this.keycloakAdmin.getUsersByRole('doctor').subscribe(data => this.doctors = data || []);
  }

  setMinDate(): void {
    const now = new Date();
    this.minDate = now.toISOString().substring(0, 16);
  }

  onPatientChange(): void {
    const id = this.form.get('patientId')?.value;
    const p = this.patients.find(x => x.id === id);
    if (p) {
      this.form.patchValue({
        patientNom: KeycloakAdminService.displayName(p),
        patientMatricule: p.username
      });
    }
  }

  onDoctorChange(): void {
    const id = this.form.get('medecinId')?.value;
    const d = this.doctors.find(x => x.id === id);
    if (d) {
      this.form.patchValue({
        medecinNom: KeycloakAdminService.displayName(d)
      });
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (this.form.get('dateTime')?.value < this.minDate) {
      alert('La date ne peut pas être dans le passé.');
      return;
    }

    this.loading = true;
    const val = this.form.value;
    
    // Preparation de la requête compatible avec le service
    const request = {
      ...val,
      appointmentDate: val.dateTime
    };

    this.appointmentService.create(request).subscribe({
      next: () => {
        this.loading = false;
        alert('Rendez-vous créé avec succès!');
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || err.error?.detail || err.message || 'Erreur inconnue';
        alert('Erreur: ' + msg);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/appointments']);
  }
}
