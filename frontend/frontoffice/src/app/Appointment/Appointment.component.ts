// appointment-table.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AppointmentService, Appointment, AppointmentRequest,
  RescheduleRequest, ConflictCheckRequest, ConflictResponse,
  AppointmentHistoryDTO, AppointmentStatsDTO
} from '../services/appointment.service';
import { KeycloakAdminService, KeycloakUser } from '../services/keycloak-admin.service';

@Component({
  selector: 'app-appointment-table',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe, RouterModule],
  templateUrl: './Appointment.component.html',
  styles: [`
    .page-shell { padding: 2rem; background-color: #f0fdf4; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .module-tag { font-size: 0.8rem; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 1px; }
    .page-title { margin: 0.5rem 0 0; font-size: 1.75rem; font-weight: 700; color: #064e3b; }
    .header-right { display: flex; gap: 1rem; align-items: center; }
    .search-wrap { position: relative; }
    .search-input { padding: 0.5rem 1rem 0.5rem 2.5rem; border: 1px solid #d1fae5; border-radius: 8px; width: 250px; font-size: 0.9rem; }
    .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #34d399; }
    .filter-select { padding: 0.5rem 1rem; border: 1px solid #d1fae5; border-radius: 8px; font-size: 0.9rem; background: white; cursor: pointer; color: #064e3b; font-weight: 500; }
    .btn-create { background: #10b981; color: white; border: none; padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
    .btn-create:hover { background: #059669; transform: translateY(-2px); }
    /* Tabs */
    .tabs { display: flex; gap: 0; margin-bottom: 1.5rem; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .tab-btn { flex: 1; padding: 0.85rem 0.5rem; font-size: 0.82rem; font-weight: 600; border: none; background: transparent; cursor: pointer; color: #64748b; transition: all 0.2s; border-bottom: 3px solid transparent; }
    .tab-btn.active { color: #10b981; border-bottom-color: #10b981; background: #f0fdf4; }
    .tab-btn:hover:not(.active) { background: #f8fafc; color: #374151; }
    /* Feature panels */
    .feature-panel { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 1.5rem; }
    .feature-panel h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #064e3b; display: flex; align-items: center; gap: 0.5rem; }
    .panel-form { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .panel-form .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .panel-form label { font-size: 0.78rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .panel-form input, .panel-form select { padding: 0.5rem 0.75rem; border: 1px solid #d1fae5; border-radius: 8px; font-size: 0.9rem; min-width: 200px; }
    .btn-run { background: #10b981; color: white; border: none; padding: 0.55rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; height: fit-content; white-space: nowrap; }
    .btn-run:hover { background: #059669; }
    .result-box { margin-top: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; font-size: 0.85rem; max-height: 350px; overflow-y: auto; }
    .result-box pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: 'Courier New', monospace; color: #1e293b; }
    .conflict-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
    .conflict-yes { background: #fee2e2; color: #b91c1c; }
    .conflict-no { background: #dcfce7; color: #15803d; }
    /* Metrics */
    .metrics-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .metric { background: white; padding: 1.5rem 1rem; border-radius: 12px; border: 1px solid #dcfce7; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
    .metric-dot { width: 100%; height: 4px; position: absolute; top: 0; left: 0; }
    .metric-value { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-top: 0.5rem; }
    .metric-label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; opacity: 0.8; }
    /* Table */
    .table-wrap { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { background: #f8fafc; padding: 1.2rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
    .data-table td { padding: 1rem; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .table-row { transition: background 0.2s; }
    .table-row:hover { background-color: #f8fafc; }
    .person-name { font-weight: 600; color: #0f172a; }
    .date-main { font-weight: 600; color: #1e293b; }
    .date-sub { font-size: 0.8rem; color: #3b82f6; font-weight: 600; }
    .type-pill { padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: #475569; }
    .status-pill { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-SCHEDULED { background: #dcfce7; color: #15803d; }
    .status-CONFIRMED { background: #dbeafe; color: #1d4ed8; }
    .status-RESCHEDULED { background: #fef9c3; color: #a16207; }
    .status-NO_SHOW { background: #ffedd5; color: #c2410c; }
    .status-CANCELLED { background: #fee2e2; color: #b91c1c; }
    .status-COMPLETED { background: #f1f5f9; color: #334155; }
    .act-btn { border: none; background: transparent; cursor: pointer; border-radius: 4px; width: 30px; height: 30px; margin: 0 2px; font-size: 1.1rem; transition: background 0.2s; }
    .act-btn:hover { background: #f1f5f9; transform: scale(1.1); }
    .table-footer { padding: 1rem 1.5rem; font-size: 0.85rem; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }

    /* Modal & Form Validation */
    .modal-backdrop { 
      position:fixed !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; 
      background: rgba(0,0,0,0.7) !important; z-index:99999 !important; 
      display:flex !important; justify-content:center !important; align-items:center !important; 
      backdrop-filter: blur(6px) !important;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .modal-card { 
      background: #ffffff !important; 
      padding: 2.5rem !important; 
      border-radius: 24px !important; 
      min-width: 560px !important; 
      max-width: 90vw !important; 
      max-height: 92vh !important;
      overflow-y: auto !important;
      box-shadow: 0 30px 100px rgba(0,0,0,0.3) !important; 
      animation: slideUp 0.3s ease-out;
      border: 1px solid #e2e8f0;
    }
    @keyframes slideUp { 
      from { opacity: 0; transform: translateY(40px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    .modal-title { 
      margin: 0 0 1.75rem !important; 
      font-size: 1.5rem !important; 
      color: #064e3b !important; 
      display: flex !important; 
      align-items: center !important; 
      gap: 0.5rem !important; 
      font-weight: 800 !important;
      padding-bottom: 1.25rem !important;
      border-bottom: 3px solid #10b981 !important;
    }
    
    .form-group { margin-bottom: 1.5rem !important; }
    .form-label { 
      display:block !important; margin-bottom:0.6rem !important; 
      font-size:0.85rem !important; font-weight:700 !important; 
      color: #334155 !important; text-transform:uppercase !important; 
      letter-spacing: 0.5px !important; 
    }
    .req { color: #dc2626 !important; margin-left: 3px !important; }
    
    .form-input, .form-select, .form-textarea { 
      width:100% !important; 
      padding: 0.85rem 1rem !important; 
      border: 2px solid #e2e8f0 !important; 
      border-radius: 12px !important; 
      font-family: inherit !important; 
      font-size: 1rem !important; 
      transition: all 0.2s !important;
      background: #f8fafc !important;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { 
      outline: none !important; 
      border-color: #10b981 !important; 
      background: #ffffff !important;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.2) !important; 
    }
    .form-input.invalid, .form-select.invalid { border-color: #dc2626 !important; }
    .error-msg { color: #dc2626 !important; font-size: 0.8rem !important; margin-top: 6px !important; font-weight: 600 !important; }
    .warning-msg { color: #d97706 !important; font-size: 0.8rem !important; margin-top: 6px !important; font-weight: 600 !important; }
    .form-row { display:flex !important; gap:1.25rem !important; margin-bottom:1.5rem !important; }
    .form-col { display: flex !important; flex-direction: column !important; }
    
    .modal-footer { 
      display:flex !important; justify-content:flex-end !important; gap:1rem !important; 
      margin-top: 2rem !important; 
      padding-top: 1.25rem !important;
      border-top: 2px solid #f1f5f9 !important;
    }
    .btn-cancel { 
      padding: 0.85rem 1.75rem !important; 
      background: #f1f5f9 !important; 
      border: none !important; 
      border-radius: 12px !important; 
      font-weight: 700 !important; 
      cursor: pointer !important; 
      color: #475569 !important;
      transition: all 0.2s !important;
    }
    .btn-cancel:hover { background: #e2e8f0 !important; color: #1e293b !important; }
    .btn-submit { 
      padding: 0.85rem 1.75rem !important; 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important; 
      color: #ffffff !important; 
      border: none !important; 
      border-radius: 12px !important; 
      font-weight: 700 !important; 
      cursor: pointer !important; 
      box-shadow: 0 6px 20px rgba(16,185,129,0.4) !important; 
      transition: all 0.2s !important;
    }
    .btn-submit:hover:not(:disabled) { 
      transform: translateY(-3px) !important; 
      box-shadow: 0 10px 30px rgba(16,185,129,0.5) !important; 
    }
    .btn-submit:disabled { background: #94a3b8 !important; cursor: not-allowed !important; box-shadow: none !important; opacity: 0.7 !important; }
  `]
})
export class AppointmentTableComponent implements OnInit {

  // ── State ─────────────────────────────────────────────────────
  activeTab: 'list' | 'conflicts' | 'history' | 'stats' | 'session' = 'list';

  appointments: Appointment[] = [];
  filtered: Appointment[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  filterStatus = '';
  filterType = '';
  showCreate = false;

  newApt: AppointmentRequest = {
    patientId: '', patientNom: '', patientMatricule: '',
    medecinId: '', medecinNom: '', appointmentDate: '',
    durationMinutes: 30, type: 'CONSULTATION', notes: ''
  };

  isEdit = false;
  editId = '';
  patients: KeycloakUser[] = [];
  doctors: KeycloakUser[] = [];

  // ── F1: Conflicts ─────────────────────────────────────────────
  conflictReq: ConflictCheckRequest = {
    medecinId: '', patientId: '', appointmentDate: '', durationMinutes: 30
  };
  conflictResult: ConflictResponse | null = null;

  // ── F2: History ───────────────────────────────────────────────
  historyMatricule = '';
  historyResult: AppointmentHistoryDTO[] = [];
  historyError = '';

  // ── F3: Stats ─────────────────────────────────────────────────
  statsMedecinId = '';
  statsFrom = '';
  statsTo = '';
  statsResult: AppointmentStatsDTO[] = [];
  statsError = '';

  // ── F5: Link to Session ───────────────────────────────────────
  sessionAptId = '';
  sessionId = '';
  sessionResult: Appointment | null = null;
  sessionError = '';

  constructor(
    private appointmentService: AppointmentService,
    private keycloakAdmin: KeycloakAdminService
  ) { }

  ngOnInit(): void {
    this.load();
    this.loadUsers();
  }

  loadUsers(): void {
    this.keycloakAdmin.getUsersByRole('patient').subscribe(data => {
      this.patients = data || [];
    });
    this.keycloakAdmin.getUsersByRole('doctor').subscribe(data => {
      this.doctors = data || [];
    });
  }

  onPatientChange(): void {
    const p = this.patients.find(x => x.id === this.newApt.patientId);
    if (p) {
      this.newApt.patientNom = KeycloakAdminService.displayName(p);
      this.newApt.patientMatricule = p.username;
    }
  }

  onDoctorChange(): void {
    const d = this.doctors.find(x => x.id === this.newApt.medecinId);
    if (d) { this.newApt.medecinNom = KeycloakAdminService.displayName(d); }
  }

  getMinDate(): string {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm
    return now.toISOString().substring(0, 16);
  }

  // ── Chargement ───────────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.error = '';
    this.appointmentService.getAll().subscribe({
      next: data => { this.appointments = data; this.applyFilters(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des rendez-vous.'; this.loading = false; }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.appointments.filter(a => {
      const matchSearch = !term ||
        (a.patientNom || '').toLowerCase().includes(term) ||
        (a.patientMatricule || '').toLowerCase().includes(term) ||
        (a.medecinNom || '').toLowerCase().includes(term) ||
        (a.notes || '').toLowerCase().includes(term);
      const matchStatus = !this.filterStatus || a.status === this.filterStatus;
      const matchType = !this.filterType || a.type === this.filterType;
      return matchSearch && matchStatus && matchType;
    });
  }

  // ── CRUD Actions ─────────────────────────────────────────────
  confirm(id: string): void {
    this.appointmentService.confirm(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Erreur confirmation: ' + (err.error?.message || err.message))
    });
  }

  cancel(id: string): void {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.appointmentService.cancel(id).subscribe({
      next: () => this.load(),
      error: (err) => alert('Erreur annulation: ' + (err.error?.message || err.message))
    });
  }

  openReschedule(appt: any): void {
    this.editId = appt.id;
    this.isEdit = false;
    const newAptDate = appt.appointmentDate?.substring(0, 16) || '';
    const newDate = prompt('Nouvelle date/heure (ex: 2026-04-20T14:30):', newAptDate);
    if (newDate && newDate.trim() !== '') {
      const req: RescheduleRequest = { newDate: newDate, reason: 'Reprogrammation manuelle' };
      this.appointmentService.reschedule(appt.id, req).subscribe({
        next: () => { this.load(); alert('Rendez-vous reprogrammé !'); },
        error: (err) => alert('Erreur reprogrammation: ' + (err.error?.message || err.message))
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Supprimer définitivement ce rendez-vous ?')) return;
    this.appointmentService.delete(id).subscribe({
      next: () => this.load(),
      error: () => alert('Erreur lors de la suppression.')
    });
  }

  openEdit(a: any): void {
    this.isEdit = true;
    this.editId = a.id;
    this.newApt = {
      patientId: a.patientId || '', patientNom: a.patientNom || '',
      patientMatricule: a.patientMatricule || '', medecinId: a.medecinId || '',
      medecinNom: a.medecinNom || '', appointmentDate: a.appointmentDate?.substring(0, 16) || '',
      durationMinutes: a.durationMinutes || 30, type: a.type || 'CONSULTATION', notes: a.notes || ''
    };
    this.showCreate = true;
  }

  openCreate(): void {
    this.isEdit = false;
    this.editId = '';
    this.newApt = { patientId: '', patientNom: '', patientMatricule: '', medecinId: '', medecinNom: '', appointmentDate: '', durationMinutes: 30, type: 'CONSULTATION', notes: '' };
    this.showCreate = true;
  }

  submitCreate(): void {
    if (!this.newApt.patientId || !this.newApt.medecinId || !this.newApt.appointmentDate) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (this.newApt.appointmentDate < this.getMinDate()) {
      alert('La date du rendez-vous ne peut pas être dans le passé.');
      return;
    }
    if (!this.newApt.durationMinutes || this.newApt.durationMinutes <= 0) {
      alert('La durée doit être d\'au moins 1 minute.');
      return;
    }

    // Ensure names are set correctly before sending
    this.onPatientChange();
    this.onDoctorChange();

    if (this.isEdit) {
      this.appointmentService.update(this.editId, this.newApt).subscribe({
        next: () => { this.showCreate = false; this.load(); alert('Rendez-vous mis à jour !'); },
        error: (err) => alert('Erreur mise à jour: ' + (err.error?.message || err.message))
      });
    } else {
      this.appointmentService.create(this.newApt).subscribe({
        next: () => { this.showCreate = false; this.load(); alert('Rendez-vous créé !'); },
        error: (err) => alert('Erreur création: ' + (err.error?.message || err.message))
      });
    }
  }

  // ── F1: Check Conflicts ───────────────────────────────────────
  runConflictCheck(): void {
    this.conflictResult = null;
    this.appointmentService.checkConflicts(this.conflictReq).subscribe({
      next: res => this.conflictResult = res,
      error: (err) => alert('Erreur: ' + (err.error?.message || err.message))
    });
  }

  // ── F2: Patient History ───────────────────────────────────────
  runHistory(): void {
    this.historyResult = [];
    this.historyError = '';
    this.appointmentService.getPatientHistory(this.historyMatricule).subscribe({
      next: res => this.historyResult = res,
      error: (err) => this.historyError = err.error?.message || 'Aucun historique trouvé.'
    });
  }

  // ── F3: Stats ─────────────────────────────────────────────────
  runStats(): void {
    this.statsResult = [];
    this.statsError = '';
    this.appointmentService.getStats(this.statsMedecinId, this.statsFrom, this.statsTo).subscribe({
      next: res => this.statsResult = res,
      error: (err) => this.statsError = err.error?.message || 'Erreur stats.'
    });
  }

  // ── F5: Link to Session ───────────────────────────────────────
  runLinkSession(): void {
    this.sessionResult = null;
    this.sessionError = '';
    this.appointmentService.linkToSession(this.sessionAptId, this.sessionId).subscribe({
      next: res => this.sessionResult = res,
      error: (err) => this.sessionError = err.error?.message || 'Erreur liaison.'
    });
  }

  // ── Métriques ─────────────────────────────────────────────────
  get metricsData() {
    return [
      { label: 'TOTAL', color: '#4f8ef7', value: this.appointments.length },
      { label: 'PLANIFIÉS', color: '#10b981', value: this.countStatus('SCHEDULED') },
      { label: 'CONFIRMÉS', color: '#3b82f6', value: this.countStatus('CONFIRMED') },
      { label: 'REPROGRAMMÉS', color: '#f59e0b', value: this.countStatus('RESCHEDULED') },
      { label: 'ABSENTS', color: '#f97316', value: this.countStatus('NO_SHOW') },
      { label: 'ANNULÉS', color: '#ef4444', value: this.countStatus('CANCELLED') },
      { label: 'TERMINÉS', color: '#94a3b8', value: this.countStatus('COMPLETED') },
    ];
  }

  private countStatus(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  trackById(_: number, a: any): any { return a.id; }
}