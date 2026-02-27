import { Component, OnInit } from '@angular/core';
import { PharmacyService, Medication } from '../services/pharmacy.service';
import { PrescriptionService, Prescription, PrescriptionStatus } from '../services/prescription.service';
import { KeycloakService } from 'keycloak-angular';

// ── Interface calculateur ────────────────────
interface DoseReminder {
  time: string;
  label: string;
  taken: boolean;
}

interface TreatmentPlan {
  medication: string;
  dosage: string;
  frequency: number;
  duration: number;
  totalUnits: number;
  dailyTimes: DoseReminder[];
  startDate: string;
  endDate: string;
  daysLeft: number;
  progressPercent: number;
}

@Component({
  selector: 'app-pharmacy',
  templateUrl: './pharmacy.component.html',
  styleUrls: ['./pharmacy.component.scss'],
  standalone: false
})
export class PharmacyComponent implements OnInit {

  activeTab: 'medications' | 'prescriptions' | 'calculator' = 'medications';

  // ── Medications ────────────────────────────
  medications: Medication[] = [];
  loadingMeds = true;
  errorMeds   = false;

  // 🔍 
  searchMed   = '';
  filterRoute = '';
  filterStock = '';
  sortMed     = 'name';

  // ── Prescriptions ──────────────────────────
  prescriptions: Prescription[] = [];
  loadingRx     = true;
  errorRx       = false;
  viewingPrescription: Prescription | null = null;
  currentUserId = '';

  // 🔍
  searchRx       = '';
  filterStatus   = '';
  filterValidity = '';
  sortRx         = 'date-desc';

  // ── UI State ──────────────────────────────
  showFilters = false;

  // ── Calculateur ────────────────────────────
  calcForm = {
    medicationName: '',
    dosage:         '',
    frequency:      3,
    duration:       7,
    startDate:      '',
    quantity:       0
  };

  treatmentPlan: TreatmentPlan | null = null;
  calcError = '';

  // ── Rappels journaliers ────────────────────
  todayReminders: DoseReminder[] = [];
  reminderDate = new Date().toISOString().split('T')[0];

  constructor(
    private pharmacyService: PharmacyService,
    private prescriptionService: PrescriptionService,
    private keycloak: KeycloakService
  ) {}

  ngOnInit(): void {
    try {
      const instance = this.keycloak.getKeycloakInstance();
      this.currentUserId = instance.subject || '';
    } catch (e) {
      console.warn('⚠️ Keycloak not ready:', e);
    }

    
    this.calcForm.startDate = new Date().toISOString().split('T')[0];

    this.loadMedications();
    this.loadPrescriptions();
  }

  // ══════════════════════════════════════════
  // MEDICATIONS
  // ══════════════════════════════════════════

  loadMedications(): void {
    this.loadingMeds = true;
    this.errorMeds   = false;
    this.pharmacyService.getAll().subscribe({
      next:  data => { this.medications = data; this.loadingMeds = false; },
      error: ()   => { this.loadingMeds = false; this.errorMeds = true; }
    });
  }

  get filteredMedications(): Medication[] {
    let result = [...this.medications];

    if (this.searchMed.trim()) {
      const q = this.searchMed.toLowerCase();
      result = result.filter(m =>
        m.medicationName.toLowerCase().includes(q) ||
        (m.dosage || '').toLowerCase().includes(q) ||
        (m.route  || '').toLowerCase().includes(q)
      );
    }

    if (this.filterRoute) result = result.filter(m => m.route === this.filterRoute);
    if (this.filterStock === 'available') result = result.filter(m => m.quantity > 10);
    else if (this.filterStock === 'low')  result = result.filter(m => m.quantity > 0 && m.quantity <= 10);
    else if (this.filterStock === 'out')  result = result.filter(m => m.quantity === 0);
    else if (this.filterStock === 'expiring') result = result.filter(m => this.isExpiringSoon(m.endDate));

    result.sort((a, b) => {
      switch (this.sortMed) {
        case 'name':       return a.medicationName.localeCompare(b.medicationName);
        case 'name-desc':  return b.medicationName.localeCompare(a.medicationName);
        case 'stock-asc':  return a.quantity - b.quantity;
        case 'stock-desc': return b.quantity - a.quantity;
        case 'expiry':     return (a.endDate || '').localeCompare(b.endDate || '');
        default: return 0;
      }
    });
    return result;
  }

  get availableRoutes(): string[] {
    return [...new Set(this.medications.map(m => m.route).filter(Boolean))] as string[];
  }

  get medStats() {
    return {
      total:     this.medications.length,
      available: this.medications.filter(m => m.quantity > 10).length,
      low:       this.medications.filter(m => m.quantity > 0 && m.quantity <= 10).length,
      out:       this.medications.filter(m => m.quantity === 0).length,
    };
  }

  resetMedFilters(): void {
    this.searchMed = ''; this.filterRoute = '';
    this.filterStock = ''; this.sortMed = 'name';
  }

  get hasMedFilters(): boolean {
    return !!(this.searchMed || this.filterRoute || this.filterStock);
  }

  // ══════════════════════════════════════════
  // PRESCRIPTIONS
  // ══════════════════════════════════════════

  loadPrescriptions(): void {
    this.loadingRx = true;
    this.errorRx   = false;
    this.prescriptionService.getAll().subscribe({
      next: data => { this.prescriptions = data; this.loadingRx = false; },
      error: ()  => { this.loadingRx = false; this.errorRx = true; }
    });
  }

  get filteredPrescriptions(): Prescription[] {
    let result = [...this.prescriptions];

    if (this.searchRx.trim()) {
      const q = this.searchRx.toLowerCase();
      result = result.filter(p =>
        (p.prescribedBy  || '').toLowerCase().includes(q) ||
        (p.instructions  || '').toLowerCase().includes(q) ||
        (p.status        || '').toLowerCase().includes(q)
      );
    }

    if (this.filterStatus) result = result.filter(p => p.status === this.filterStatus);
    if (this.filterValidity === 'valid')   result = result.filter(p => !this.isExpired(p.validUntil));
    if (this.filterValidity === 'expired') result = result.filter(p => this.isExpired(p.validUntil));

    result.sort((a, b) => {
      switch (this.sortRx) {
        case 'date-desc': return (b.prescriptionDate || '').localeCompare(a.prescriptionDate || '');
        case 'date-asc':  return (a.prescriptionDate || '').localeCompare(b.prescriptionDate || '');
        case 'doctor':    return (a.prescribedBy || '').localeCompare(b.prescribedBy || '');
        case 'status':    return (a.status || '').localeCompare(b.status || '');
        default: return 0;
      }
    });
    return result;
  }

  get rxStats() {
    return {
      total:     this.prescriptions.length,
      active:    this.prescriptions.filter(p => !this.isExpired(p.validUntil) && p.status !== 'CANCELLED').length,
      expired:   this.prescriptions.filter(p => this.isExpired(p.validUntil)).length,
      pending:   this.prescriptions.filter(p => p.status === 'PENDING').length,
      completed: this.prescriptions.filter(p => p.status === 'COMPLETED').length,
    };
  }

  resetRxFilters(): void {
    this.searchRx = ''; this.filterStatus = '';
    this.filterValidity = ''; this.sortRx = 'date-desc';
  }

  get hasRxFilters(): boolean {
    return !!(this.searchRx || this.filterStatus || this.filterValidity);
  }

  // ══════════════════════════════════════════
  // 💊 CALCULATEUR DE DOSES
  // ══════════════════════════════════════════

  // Pré-remplir depuis une prescription
  loadFromPrescription(p: Prescription): void {
    if (p.medications && p.medications.length > 0) {
      const med = p.medications[0];
      this.calcForm = {
        medicationName: med.medicationName || '',
        dosage:         med.dosage || '',
        frequency:      med.frequency || 3,
        duration:       med.duration || 7,
        startDate:      p.prescriptionDate || new Date().toISOString().split('T')[0],
        quantity:       med.quantity || 0
      };
      this.treatmentPlan = null;
      this.activeTab = 'calculator';
    }
  }

  calculateTreatment(): void {
    this.calcError = '';

    if (!this.calcForm.medicationName.trim()) {
      this.calcError = 'Please enter a medication name.';
      return;
    }
    if (this.calcForm.frequency < 1 || this.calcForm.frequency > 12) {
      this.calcError = 'Frequency must be between 1 and 12 times per day.';
      return;
    }
    if (this.calcForm.duration < 1 || this.calcForm.duration > 365) {
      this.calcError = 'Duration must be between 1 and 365 days.';
      return;
    }

    const start = new Date(this.calcForm.startDate);
    const end   = new Date(start);
    end.setDate(end.getDate() + this.calcForm.duration - 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const daysLeft   = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
    const daysDone   = this.calcForm.duration - daysLeft;
    const progress   = Math.min(100, Math.round((daysDone / this.calcForm.duration) * 100));
    const totalUnits = this.calcForm.frequency * this.calcForm.duration;
    const dailyTimes = this.generateDailySchedule(this.calcForm.frequency);

    this.treatmentPlan = {
      medication:      this.calcForm.medicationName,
      dosage:          this.calcForm.dosage,
      frequency:       this.calcForm.frequency,
      duration:        this.calcForm.duration,
      totalUnits,
      dailyTimes,
      startDate:       start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate:         end.toLocaleDateString('en-US',   { month: 'short', day: 'numeric', year: 'numeric' }),
      daysLeft,
      progressPercent: progress
    };

    this.todayReminders = [...dailyTimes];
  }

  private generateDailySchedule(frequency: number): DoseReminder[] {
    const schedules: Record<number, { time: string; label: string }[]> = {
      1:  [{ time: '08:00', label: 'Morning' }],
      2:  [{ time: '08:00', label: 'Morning' }, { time: '20:00', label: 'Evening' }],
      3:  [{ time: '07:00', label: 'Morning' }, { time: '13:00', label: 'Afternoon' }, { time: '19:00', label: 'Evening' }],
      4:  [{ time: '07:00', label: 'Morning' }, { time: '11:00', label: 'Mid-Morning' }, { time: '15:00', label: 'Afternoon' }, { time: '21:00', label: 'Night' }],
      6:  [{ time: '06:00', label: '6 AM' }, { time: '10:00', label: '10 AM' }, { time: '14:00', label: '2 PM' }, { time: '18:00', label: '6 PM' }, { time: '22:00', label: '10 PM' }, { time: '02:00', label: '2 AM' }],
      8:  Array.from({ length: 8 },  (_, i) => ({ time: `${String((6 + i * 3) % 24).padStart(2, '0')}:00`, label: `Dose ${i + 1}` })),
      12: Array.from({ length: 12 }, (_, i) => ({ time: `${String((6 + i * 2) % 24).padStart(2, '0')}:00`, label: `Dose ${i + 1}` })),
    };

    if (schedules[frequency]) {
      return schedules[frequency].map(s => ({ ...s, taken: false }));
    }

    // Génération automatique pour les autres fréquences
    const interval = Math.floor(24 / frequency);
    return Array.from({ length: frequency }, (_, i) => ({
      time:  `${String((6 + i * interval) % 24).padStart(2, '0')}:00`,
      label: `Dose ${i + 1}`,
      taken: false
    }));
  }

  toggleReminder(index: number): void {
    this.todayReminders[index].taken = !this.todayReminders[index].taken;
  }

  get takenCount(): number {
    return this.todayReminders.filter(r => r.taken).length;
  }

  get stockSufficient(): boolean {
    if (!this.treatmentPlan || !this.calcForm.quantity) return true;
    return this.calcForm.quantity >= this.treatmentPlan.totalUnits;
  }

  get stockNeeded(): number {
    if (!this.treatmentPlan) return 0;
    return Math.max(0, this.treatmentPlan.totalUnits - this.calcForm.quantity);
  }

  resetCalculator(): void {
    this.treatmentPlan  = null;
    this.calcError      = '';
    this.todayReminders = [];
    this.calcForm = {
      medicationName: '',
      dosage:         '',
      frequency:      3,
      duration:       7,
      startDate:      new Date().toISOString().split('T')[0],
      quantity:       0
    };
  }

  // ── Helpers ────────────────────────────────
  view(p: Prescription): void { this.viewingPrescription = p; }
  closeView(): void           { this.viewingPrescription = null; }

  isExpiringSoon(dateStr?: string): boolean {
    if (!dateStr) return false;
    const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return diff <= 30 && diff >= 0;
  }

  isExpired(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

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

  trackById(index: number, item: any): string {
    return item.id || index;
  }
}