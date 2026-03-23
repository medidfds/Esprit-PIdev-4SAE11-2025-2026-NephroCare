import { Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormGroup, FormArray,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { HospitalizationService, HospitalizationPayload } from '../../../services/hospitalization.service';
import { RoomService, Room } from '../../../services/Room.service';
import { KeycloakAdminService, KeycloakUser } from '../../../services/keycloak-admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

function dischargeDateValidator(group: AbstractControl): ValidationErrors | null {
  const admission = group.get('admissionDate')?.value;
  const discharge = group.get('dischargeDate')?.value;
  if (admission && discharge && new Date(discharge) <= new Date(admission)) {
    return { dischargeDateBeforeAdmission: true };
  }
  return null;
}

function bloodPressureValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (!val) return null;
  return /^\d{2,3}\/\d{2,3}$/.test(val) ? null : { bloodPressureFormat: true };
}

@Component({
  selector: 'app-hospitalization',
  templateUrl: './hospitalization.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./hospitalization.component.css']
})
export class HospitalizationComponent implements OnInit {

  hospitalizations: any[]         = [];
  filteredHospitalizations: any[] = [];
  form!: FormGroup;
  editingId: number | null        = null;
  searchTerm: string              = '';
  todayIso = new Date().toISOString().slice(0, 16);

  // ── Keycloak current user ──────────────────────────────────────────────
  currentUserId:   string = '';
  currentUserName: string = '';
  currentUserRole: string = '';

  get isDoctor():  boolean { return this.currentUserRole === 'doctor'; }
  get isPatient(): boolean { return this.currentUserRole === 'patient'; }
  get isNurse():   boolean { return this.currentUserRole === 'nurse'; }
  get isAdmin():   boolean { return this.currentUserRole === 'admin'; }

  get canCreate(): boolean { return !this.isNurse; }
  get canDelete(): boolean { return !this.isNurse; }

  get formVisible(): boolean {
    if (this.isNurse) return this.editingId !== null;
    return true;
  }

  // ── Rooms ──────────────────────────────────────────────────────────────
  availableRooms: Room[] = [];
  allRooms:       Room[] = [];
  loadingRooms    = false;
  selectedRoom:   Room | null = null;

  readonly roomTypeLabels: Record<string, string> = {
    standard:  'Standard',
    intensive: 'ICU',
    isolation: 'Isolation',
    pediatric: 'Pediatric',
    maternity: 'Maternity',
  };

  readonly roomTypeColors: Record<string, string> = {
    standard:  'bg-blue-100 text-blue-700',
    intensive: 'bg-red-100 text-red-700',
    isolation: 'bg-amber-100 text-amber-700',
    pediatric: 'bg-pink-100 text-pink-700',
    maternity: 'bg-purple-100 text-purple-700',
  };

  // ── Patients ───────────────────────────────────────────────────────────
  patientUsers:    KeycloakUser[] = [];
  patientsLoading  = false;
  patientSearch    = '';
  dropdownOpen     = false;
  selectedPatient: KeycloakUser | null = null;

  get filteredPatients(): KeycloakUser[] {
    const term = this.patientSearch.toLowerCase().trim();
    if (!term) return this.patientUsers;
    return this.patientUsers.filter(u =>
      KeycloakAdminService.displayName(u).toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
    );
  }

  private patientNameCache: Map<string, string> = new Map();

  private readonly NURSE_LOCKED_FIELDS = [
    'admissionDate', 'dischargeDate', 'roomId',
    'admissionReason', 'status', 'userId', 'attendingDoctorId'
  ];

  constructor(
    private service:         HospitalizationService,
    private roomService:     RoomService,
    private adminService:    KeycloakAdminService,
    private fb:              FormBuilder,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.loadKeycloakUser();
    this.initForm();
    this.loadAll();
    this.loadPatients();
    this.loadRooms();
  }

  // ══════════════════════════════════════════════
  //  KEYCLOAK
  // ══════════════════════════════════════════════
  private loadKeycloakUser(): void {
    const token: any = this.keycloakService.getKeycloakInstance().tokenParsed;
    if (!token) return;
    this.currentUserId   = token['sub'] || '';
    this.currentUserName = this.buildName(token);
    const realmRoles: string[]  = token['realm_access']?.roles || [];
    const clientAccess: any     = token['resource_access'] || {};
    const clientRoles: string[] = Object.values(clientAccess).flatMap((c: any) => c?.roles || []);
    const allRoles = [...realmRoles, ...clientRoles].map((r: string) => r.toLowerCase());
    const ROLE_PRIORITY = ['admin', 'doctor', 'nurse', 'patient'];
    this.currentUserRole = ROLE_PRIORITY.find(r => allRoles.includes(r)) || '';
  }

  private buildName(token: any): string {
    const first = token['given_name']  || '';
    const last  = token['family_name'] || '';
    return `${first} ${last}`.trim() || token['preferred_username'] || 'Unknown';
  }

  // ══════════════════════════════════════════════
  //  ROOMS
  // ══════════════════════════════════════════════
  loadRooms(): void {
    this.loadingRooms = true;
    this.roomService.getAll().subscribe({
      next: rooms => {
        this.allRooms       = rooms;
        this.availableRooms = rooms.filter(r => r.available);
        this.loadingRooms   = false;
      },
      error: () => { this.loadingRooms = false; }
    });
  }

  selectRoom(room: Room): void {
    this.selectedRoom = room;
    this.form.get('roomId')?.setValue(room.id);
  }

  occupancyPercent(room: Room): number {
    return Math.round((room.currentOccupancy / room.capacity) * 100);
  }

  // ══════════════════════════════════════════════
  //  PATIENTS
  // ══════════════════════════════════════════════
  loadPatients(): void {
    this.patientsLoading = true;
    this.adminService.getUsersByRole('patient').subscribe({
      next: users => {
        this.patientUsers    = users;
        this.patientsLoading = false;
        users.forEach(u => this.patientNameCache.set(u.id, KeycloakAdminService.displayName(u)));
      },
      error: () => {
        this.patientsLoading = false;
        this.buildPatientCacheFromHospitalizations();
      }
    });
  }

  private buildPatientCacheFromHospitalizations(): void {
    this.hospitalizations.forEach(h => {
      if (!h.userId) return;
      const name =
        (h.patientFirstName && h.patientLastName
          ? `${h.patientFirstName} ${h.patientLastName}`.trim() : null) ||
        h.patientName || h.patientFullName || h.userName || null;
      if (name) this.patientNameCache.set(h.userId, name);
    });
  }

  openDropdown(): void {
    if (this.isNurse) return;
    this.dropdownOpen  = true;
    this.patientSearch = '';
  }

  selectPatient(user: KeycloakUser): void {
    this.selectedPatient = user;
    this.form.get('userId')?.setValue(user.id);
    this.dropdownOpen  = false;
    this.patientSearch = '';
  }

  clearPatient(): void {
    if (this.isNurse) return;
    this.selectedPatient = null;
    this.form.get('userId')?.setValue('');
  }

  patientDisplayName(user: KeycloakUser): string {
    return KeycloakAdminService.displayName(user);
  }

  getInitials(user: KeycloakUser | null): string {
    if (!user) return '?';
    const name = KeycloakAdminService.displayName(user);
    return name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  // ══════════════════════════════════════════════
  //  FORM
  // ══════════════════════════════════════════════
  private initForm(): void {
    this.form = this.fb.group(
      {
        admissionDate:     ['', Validators.required],
        dischargeDate:     [''],
        roomId:            [null, Validators.required],  // ← replaces roomNumber
        admissionReason:   ['', [Validators.required, Validators.maxLength(255)]],
        status:            ['', Validators.required],
        userId:            ['', Validators.required],
        attendingDoctorId: [{ value: this.currentUserId, disabled: false }, Validators.required],
        vitalSignsRecords: this.fb.array([])
      },
      { validators: dischargeDateValidator }
    );
  }

  private applyRolePermissions(): void {
    if (this.isNurse) {
      this.NURSE_LOCKED_FIELDS.forEach(f => this.form.get(f)?.disable());
    } else {
      this.NURSE_LOCKED_FIELDS.forEach(f => this.form.get(f)?.enable());
    }
  }

  // ══════════════════════════════════════════════
  //  VITAL SIGNS
  // ══════════════════════════════════════════════
  get vitalSigns(): FormArray {
    return this.form.get('vitalSignsRecords') as FormArray;
  }

  createVitalSignGroup(vs?: any): FormGroup {
    return this.fb.group({
      recordDate:       [vs?.recordDate       || '', Validators.required],
      temperature:      [vs?.temperature      || '', [Validators.required, Validators.min(30), Validators.max(45)]],
      bloodPressure:    [vs?.bloodPressure    || '', [Validators.required, bloodPressureValidator]],
      heartRate:        [vs?.heartRate        || '', [Validators.required, Validators.min(20), Validators.max(300)]],
      respiratoryRate:  [vs?.respiratoryRate  || '', [Validators.required, Validators.min(1),  Validators.max(100)]],
      oxygenSaturation: [vs?.oxygenSaturation || '', [Validators.required, Validators.min(0),  Validators.max(100)]],
      notes:            [vs?.notes            || '', Validators.maxLength(255)],
      recordedBy:       [{ value: vs?.recordedBy || this.currentUserName, disabled: true }]
    });
  }

  addVitalSign(vs?: any): void       { this.vitalSigns.push(this.createVitalSignGroup(vs)); }
  removeVitalSign(i: number): void   { this.vitalSigns.removeAt(i); }

  vsField(i: number, field: string): AbstractControl | null {
    return this.vitalSigns.at(i).get(field);
  }
  vsHasError(i: number, field: string, error: string): boolean {
    const ctrl = this.vsField(i, field);
    return !!(ctrl?.hasError(error) && (ctrl.dirty || ctrl.touched));
  }

  // ══════════════════════════════════════════════
  //  CRUD
  // ══════════════════════════════════════════════
  loadAll(): void {
    this.service.getAll().subscribe({
      next: (data: any[]) => {
        this.hospitalizations = data || [];
        this.filterHospitalizations();
        this.buildPatientCacheFromHospitalizations();
      },
      error: err => console.error('Error loading hospitalizations', err)
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    // ── Build payload: send room as { id } not as a plain string ──────────
    const payload: HospitalizationPayload = {
      admissionDate:     raw.admissionDate ? raw.admissionDate + ':00' : '',
      dischargeDate:     raw.dischargeDate ? raw.dischargeDate + ':00' : null,
      room:              { id: raw.roomId },
      admissionReason:   raw.admissionReason,
      status:            raw.status,
      userId:            raw.userId,
      attendingDoctorId: raw.attendingDoctorId,
      vitalSignsRecords: raw.vitalSignsRecords,
    };

    const obs = this.editingId
      ? this.service.update(this.editingId, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: () => { this.loadAll(); this.cancel(); },
      error: err => console.error('Save error:', err?.error ?? err)
    });
  }

  edit(h: any): void {
    this.editingId = h.id;

    // ── Restore room selection from the embedded room object ──────────────
    const roomId = h.room?.id ?? null;
    this.selectedRoom    = roomId ? (this.allRooms.find(r => r.id === roomId) ?? null) : null;
    this.selectedPatient = this.patientUsers.find(u => u.id === h.userId) || null;

    this.form.patchValue({
      admissionDate:     this.formatDateForInput(h.admissionDate),
      dischargeDate:     this.formatDateForInput(h.dischargeDate),
      roomId:            roomId,
      admissionReason:   h.admissionReason,
      status:            h.status?.toLowerCase(),
      userId:            h.userId,
      attendingDoctorId: h.attendingDoctorId || this.currentUserId,
    });

    this.vitalSigns.clear();
    (h.vitalSignsRecords || []).forEach((vs: any) => this.addVitalSign(vs));

    this.applyRolePermissions();
  }

  delete(id?: number): void {
    if (!id || this.isNurse) return;
    if (!confirm('Delete this hospitalization record?')) return;
    this.service.delete(id).subscribe({
      next: () => this.loadAll(),
      error: err => console.error('Error deleting', err)
    });
  }

  cancel(): void {
    this.editingId       = null;
    this.selectedPatient = null;
    this.selectedRoom    = null;
    this.form.reset();
    this.form.get('attendingDoctorId')?.setValue(this.currentUserId);
    this.vitalSigns.clear();
    this.NURSE_LOCKED_FIELDS.forEach(f => this.form.get(f)?.enable());
    this.loadRooms(); // refresh availability after any changes
  }

  filterHospitalizations(): void {
  const term = this.searchTerm?.toLowerCase() || '';
  this.filteredHospitalizations = this.hospitalizations.filter(h =>
    !term ||
    (h.room?.roomNumber     || '').toLowerCase().includes(term) ||  // ← removed || h.roomNumber
    (h.admissionReason      || '').toLowerCase().includes(term) ||
    (h.status               || '').toLowerCase().includes(term) ||
    String(h.userId         || '').toLowerCase().includes(term) ||
    String(h.attendingDoctorId || '').includes(term)
  );
}

  // ── Display helpers ────────────────────────────────────────────────────
  getPatientDisplayName(userId: string): string {
    if (!userId) return '—';
    const found = this.patientUsers.find(u => u.id === userId);
    if (found) return KeycloakAdminService.displayName(found);
    if (this.patientNameCache.has(userId)) return this.patientNameCache.get(userId)!;
    return this.patientsLoading ? 'Loading…' : `Patient #${userId.slice(0, 8)}`;
  }

  getPatientInitials(userId: string): string {
    const name = this.getPatientDisplayName(userId);
    if (!name || name.startsWith('Patient #') || name === 'Loading…') return '?';
    return name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  get currentUserTitle(): string {
    if (this.isNurse)  return 'Nurse';
    if (this.isDoctor) return 'Dr.';
    return '';
  }

  private formatDateForInput(date: string | null): string | null {
    return date ? date.substring(0, 16) : null;
  }

  get f() { return this.form.controls; }

  fieldError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && (ctrl.dirty || ctrl.touched));
  }

  get crossFieldError(): boolean {
    return !!(
      this.form.hasError('dischargeDateBeforeAdmission') &&
      (this.form.get('dischargeDate')?.dirty || this.form.get('dischargeDate')?.touched)
    );
  }
}