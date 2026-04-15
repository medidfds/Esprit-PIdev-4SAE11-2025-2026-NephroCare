import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';

import {
  DialysisFrontService,
  DialysisSessionDto,
  DialysisTreatmentDto,
  ScheduledSessionDto
} from '../../../services/dialysis-front.service';

import {
  DialysisTransportFrontService,
  PatientAvailabilityResponseDto,
  PatientAvailabilityResponseRequest,
  PatientReadinessResponseDto,
  PatientTransportPreferenceDto,
  SaveTransportPreferenceRequestDto,
  TransportRequestDto,
  AvailabilityStatus,
  ChildMood
} from '../../../services/dialysis-transport-front.service';

type SessionFilter = 'all' | 'done' | 'open';
type SortField = 'date-desc' | 'date-asc' | 'ktv-desc' | 'ktv-asc';

type SummaryVm = {
  totalSessions: number;
  activeTreatment: DialysisTreatmentDto | null;
  avgKtV: number | null;
  compliancePct: number | null;
  lastSessionDate: string | null;
  nextSessionDate: string | null;
};

@Component({
  selector: 'app-dialysis-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialysis-portal.component.html',
  styleUrls: ['./dialysis-portal.component.css'],
})
export class DialysisPortalComponent implements OnInit {
  loading = true;

  treatments: DialysisTreatmentDto[] = [];
  sessions: DialysisSessionDto[] = [];
  filteredSessions: DialysisSessionDto[] = [];
  upcomingSchedule: ScheduledSessionDto[] = [];
  upcomingLoading = false;

  // Per-session logistics state (keyed by scheduledSessionId)
  sessionReadinessMap: Record<string, PatientReadinessResponseDto | null> = {};
  sessionTransportMap: Record<string, TransportRequestDto | null> = {};
  sessionLogisticsLoading: Record<string, boolean> = {};
  logisticsExpanded: Record<string, boolean> = {};

  hasAnyData = false;

  // toolbar
  searchTerm = '';
  sessionFilter: SessionFilter = 'all';
  sortField: SortField = 'date-desc';

  // flags
  isLowKtv = false;
  isLowCompliance = false;

  summary: SummaryVm = {
    totalSessions: 0,
    activeTreatment: null,
    avgKtV: null,
    compliancePct: null,
    lastSessionDate: null,
    nextSessionDate: null,
  };

  // details drawer (instead of alert)
  detailsOpen = false;
  selectedSession: DialysisSessionDto | null = null;
  selectedSessionReadiness: PatientReadinessResponseDto | null = null;
  readinessLoading = false;

  // availability response drawer
  availabilityOpen = false;
  selectedAvailabilitySession: DialysisSessionDto | null = null;
  availabilityLoading = false;
  availabilitySaving = false;
  availabilityData: PatientAvailabilityResponseDto | null = null;
  
  availabilityForm: PatientAvailabilityResponseRequest = {
    availabilityStatus: 'CONFIRMED',
    childMood: 'CALM',
    transportNeeded: false,
    hasTransportAlternative: false,
    comment: ''
  };

  // transport preferences
  preferenceOpen = false;
  preferenceLoading = false;
  preferenceSaving = false;
  globalPatientId: string | null = null;
  preferenceData: PatientTransportPreferenceDto | null = null;
  preferenceForm: SaveTransportPreferenceRequestDto = {
    defaultTransportNeeded: false,
    hasTransportAlternative: false,
    preferredPickupZone: 'Home',
    wheelchairRequired: false,
    notes: '',
    pickupLat: undefined,
    pickupLng: undefined,
    pickupAddress: undefined
  };

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  constructor(
    private api: DialysisFrontService,
    private transportApi: DialysisTransportFrontService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;

    forkJoin({
      treatments: this.api.getMyTreatments().pipe(catchError(() => of([] as DialysisTreatmentDto[]))),
      sessions: this.api.getMyHistory().pipe(catchError(() => of([] as DialysisSessionDto[]))),
    }).subscribe(({ treatments, sessions }) => {
      this.treatments = treatments ?? [];
      this.sessions = (sessions ?? [])
        .slice()
        .sort((a, b) => this.safeDate(b.sessionDate) - this.safeDate(a.sessionDate));

      this.buildSummary();
      this.applyFilters();

      this.hasAnyData = this.treatments.length > 0 || this.sessions.length > 0;
      if (this.treatments.length > 0) {
        this.globalPatientId = this.treatments[0].patientId;
        this.loadPreference();
      }
      this.loading = false;
    });

    // Load upcoming scheduled sessions (correct data source for logistics)
    this.upcomingLoading = true;
    this.api.getMyUpcomingSchedule().pipe(catchError(() => of([] as ScheduledSessionDto[]))).subscribe(data => {
      this.upcomingSchedule = data ?? [];
      this.upcomingLoading = false;
      // Auto-load logistics summary for each upcoming session
      this.upcomingSchedule.forEach(s => this.loadSessionLogistics(s.id));
    });
  }

  // ─────────────────────────────────────────────
  // SESSION LOGISTICS (readiness + transport per upcoming session)
  // ─────────────────────────────────────────────
  loadSessionLogistics(sessionId: string): void {
    if (!sessionId) return;
    this.sessionLogisticsLoading[sessionId] = true;
    this.sessionReadinessMap[sessionId] = null;
    this.sessionTransportMap[sessionId] = null;

    // Load readiness
    this.transportApi.getReadiness(sessionId).pipe(
      catchError(() => of(null))
    ).subscribe(r => {
      this.sessionReadinessMap[sessionId] = r;
      // Mark loading done only after both calls complete
      if (!this.sessionTransportMap.hasOwnProperty(sessionId) || this.sessionTransportMap[sessionId] !== undefined) {
        this.sessionLogisticsLoading[sessionId] = false;
      }
    });

    // Load transport request (404 = no request created yet)
    this.transportApi.getTransportBySession(sessionId).pipe(
      catchError(() => of(null))
    ).subscribe(t => {
      this.sessionTransportMap[sessionId] = t;
      this.sessionLogisticsLoading[sessionId] = false;
    });
  }

  toggleLogistics(sessionId: string): void {
    this.logisticsExpanded[sessionId] = !this.logisticsExpanded[sessionId];
  }

  readinessBadgeClass(status: string | undefined): string {
    if (status === 'READY') return 'badge-logistics-ok';
    if (status === 'READY_WITH_WARNING') return 'badge-logistics-warn';
    if (status === 'NOT_READY') return 'badge-logistics-danger';
    return 'badge-logistics-muted';
  }

  readinessBadgeLabel(status: string | undefined): string {
    if (status === 'READY') return '✓ Ready';
    if (status === 'READY_WITH_WARNING') return '⚠ Ready with warning';
    if (status === 'NOT_READY') return '✗ Not ready';
    return 'Pending';
  }

  transportBadgeClass(status: string | undefined | null): string {
    if (!status) return 'badge-logistics-muted';
    if (status === 'CONFIRMED') return 'badge-logistics-ok';
    if (status === 'REJECTED') return 'badge-logistics-danger';
    if (status === 'PENDING_APPROVAL' || status === 'REQUESTED') return 'badge-logistics-pending';
    return 'badge-logistics-muted';
  }

  transportBadgeLabel(status: string | undefined | null): string {
    if (!status) return 'No request';
    if (status === 'REQUESTED') return '⏳ Requested';
    if (status === 'PENDING_APPROVAL') return '⏳ Pending approval';
    if (status === 'CONFIRMED') return '✓ Approved';
    if (status === 'REJECTED') return '✗ Rejected';
    if (status === 'CANCELLED') return 'Cancelled';
    return status;
  }

  assignmentLabel(transport: TransportRequestDto | null | undefined): string {
    if (!transport) return '';
    if (transport.assignedVehicleCode) return `Vehicle: ${transport.assignedVehicleCode}`;
    if (transport.assignedGroupStatus === 'VALIDATED') return 'Assigned to ride group';
    if (transport.assignedGroupStatus === 'PROPOSED') return 'Ride group proposed';
    return 'Not yet assigned';
  }

  // ─────────────────────────────────────────────
  // TRANSPORT PREFERENCES
  // ─────────────────────────────────────────────
  loadPreference(): void {
    if (!this.globalPatientId) return;
    this.preferenceLoading = true;
    this.transportApi.getPreference(this.globalPatientId).subscribe({
      next: (data) => {
        this.preferenceData = data;
        if (data) {
           this.preferenceForm = {
             defaultTransportNeeded: data.defaultTransportNeeded,
             hasTransportAlternative: data.hasTransportAlternative,
             preferredPickupZone: data.preferredPickupZone || 'Home',
             pickupAddress: data.pickupAddress,
             pickupLat: data.pickupLat,
             pickupLng: data.pickupLng,
             wheelchairRequired: data.wheelchairRequired,
             notes: data.notes || ''
           };
        }
        this.preferenceLoading = false;
      },
      error: () => {
        this.preferenceLoading = false;
      }
    });
  }

  togglePreference(): void {
    this.preferenceOpen = !this.preferenceOpen;
    if (this.preferenceOpen) {
      setTimeout(() => this.initMap(), 200);
    } else {
      if (this.map) {
        this.map.remove();
        this.map = undefined;
        this.marker = undefined;
      }
    }
  }

  initMap(): void {
    if (this.map) {
      this.map.remove();
    }
    const initialLat = this.preferenceForm.pickupLat || 36.8065;
    const initialLng = this.preferenceForm.pickupLng || 10.1815;
    
    this.map = L.map('pickup-map').setView([initialLat, initialLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    if (this.preferenceForm.pickupLat && this.preferenceForm.pickupLng) {
      this.marker = L.marker([this.preferenceForm.pickupLat, this.preferenceForm.pickupLng], { icon: customIcon }).addTo(this.map);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng, { icon: customIcon }).addTo(this.map!);
      }

      this.preferenceForm.pickupLat = lat;
      this.preferenceForm.pickupLng = lng;
      
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            this.preferenceForm.pickupAddress = data.display_name;
          }
        })
        .catch(err => console.error('Geocoding error', err));
    });
  }

  savePreference(): void {
    if (!this.globalPatientId) return;
    this.preferenceSaving = true;
    this.transportApi.saveOrUpdatePreference(this.globalPatientId, this.preferenceForm).subscribe({
      next: (data) => {
        this.preferenceData = data;
        this.preferenceSaving = false;
        this.preferenceOpen = false;
        alert('Transport preferences saved successfully.');
      },
      error: () => {
        this.preferenceSaving = false;
        alert('Failed to save transport preferences.');
      }
    });
  }

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  private buildSummary(): void {
    const active = this.findActiveTreatment(this.treatments);
    const avg = this.computeAvgKtV(this.sessions);
    const lastIso = this.sessions.length ? this.sessions[0].sessionDate : null;

    const weekCount = this.countSessionsThisWeek(this.sessions);

    const compliance =
      active?.frequencyPerWeek && Number(active.frequencyPerWeek) > 0
        ? this.clamp((weekCount / Number(active.frequencyPerWeek)) * 100, 0, 100)
        : null;

    const nextIso = active ? this.computeNextSessionDateIso(active, lastIso) : null;

    this.summary = {
      totalSessions: this.sessions.length,
      activeTreatment: active,
      avgKtV: avg,
      compliancePct: compliance,
      lastSessionDate: lastIso,
      nextSessionDate: nextIso,
    };

    this.isLowKtv = avg != null && avg < 1.2;
    this.isLowCompliance = compliance != null && compliance < 70;
  }

  private findActiveTreatment(list: DialysisTreatmentDto[]): DialysisTreatmentDto | null {
    return (list ?? []).find((t) => t.status === 'ACTIVE') ?? null;
  }

  private computeAvgKtV(list: DialysisSessionDto[]): number | null {
    const values = (list ?? [])
      .map((s) => this.sessionKtv(s))
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    if (!values.length) return null;
    const sum = values.reduce((acc, x) => acc + x, 0);
    return sum / values.length;
  }

  private sessionKtv(s: DialysisSessionDto): number | null {
    const v = s.eKtV ?? s.spKtV ?? s.achievedKtV;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  private countSessionsThisWeek(list: DialysisSessionDto[]): number {
    const { start, end } = this.getWeekBounds(new Date());
    return (list ?? []).filter((s) => {
      const d = s.sessionDate ? new Date(s.sessionDate) : null;
      return d ? d >= start && d <= end : false;
    }).length;
  }

  private computeNextSessionDateIso(
    t: DialysisTreatmentDto,
    lastSessionIso: string | null
  ): string | null {
    const freq = Number(t.frequencyPerWeek);
    if (!Number.isFinite(freq) || freq <= 0) return null;

    const base = lastSessionIso
      ? new Date(lastSessionIso)
      : t.startDate
        ? new Date(t.startDate)
        : new Date();

    const intervalDays = Math.max(1, Math.round(7 / freq));
    const next = new Date(base);
    next.setDate(next.getDate() + intervalDays);
    return next.toISOString();
  }

  // ─────────────────────────────────────────────
  // FILTERS / SORT
  // ─────────────────────────────────────────────
  setSessionFilter(f: SessionFilter): void {
    this.sessionFilter = f;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    let list = (this.sessions ?? []).slice();

    if (this.sessionFilter === 'open') list = list.filter((s) => this.isOpen(s));
    if (this.sessionFilter === 'done') list = list.filter((s) => !this.isOpen(s));

    if (q) {
      list = list.filter((s) => {
        const dt = s.sessionDate ? new Date(s.sessionDate) : null;
        const dateStr = dt ? dt.toLocaleString() : '';
        const statusStr = this.isOpen(s) ? 'open in progress' : 'done completed';
        const ktvStr = String(this.sessionKtv(s) ?? '');
        const bpStr = String(s.preBloodPressure ?? '');
        const compStr = String(s.complications ?? '');
        const hay = `${dateStr} ${statusStr} ${ktvStr} ${bpStr} ${compStr}`.toLowerCase();
        return hay.includes(q);
      });
    }

    list.sort((a, b) => {
      if (this.sortField === 'date-desc') return this.safeDate(b.sessionDate) - this.safeDate(a.sessionDate);
      if (this.sortField === 'date-asc') return this.safeDate(a.sessionDate) - this.safeDate(b.sessionDate);

      const ak = this.sessionKtv(a) ?? -Infinity;
      const bk = this.sessionKtv(b) ?? -Infinity;

      if (this.sortField === 'ktv-desc') return bk - ak;
      if (this.sortField === 'ktv-asc') return ak - bk;
      return 0;
    });

    this.filteredSessions = list;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.sessionFilter = 'all';
    this.sortField = 'date-desc';
    this.applyFilters();
  }

  // ─────────────────────────────────────────────
  // UI helpers used in HTML
  // ─────────────────────────────────────────────
  isOpen(s: DialysisSessionDto): boolean {
    return s.weightAfter == null;
  }

  isLowSessionKtv(s: DialysisSessionDto): boolean {
    const v = this.sessionKtv(s);
    return v != null && v < 1.2;
  }

  sessionKtvLabel(s: DialysisSessionDto): string {
    const v = this.sessionKtv(s);
    return v == null ? '—' : v.toFixed(2);
  }

  displayKtVName(s: DialysisSessionDto): string {
    if (typeof s.eKtV === 'number') return 'eKt/V';
    if (typeof s.spKtV === 'number') return 'spKt/V';
    return 'Kt/V';
  }

  shiftLabel(shift: string): string {
    const map: Record<string, string> = {
      MORNING: '🌅 Morning',
      AFTERNOON: '☀️ Afternoon',
      EVENING: '🌙 Evening'
    };
    return map[shift] ?? shift;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openSessionDetails(s: DialysisSessionDto): void {
    this.selectedSession = s;
    this.detailsOpen = true;
    this.availabilityOpen = false;
    this.readinessLoading = true;
    this.selectedSessionReadiness = null;

    setTimeout(() => {
      const el = document.getElementById('session-details');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    if (s.id) {
      this.transportApi.getReadiness(s.id).subscribe({
        next: (data) => {
          this.selectedSessionReadiness = data;
          this.readinessLoading = false;
        },
        error: () => {
          this.readinessLoading = false;
        }
      });
    } else {
      this.readinessLoading = false;
    }
  }

  closeSessionDetails(): void {
    this.detailsOpen = false;
    this.selectedSession = null;
    this.selectedSessionReadiness = null;
  }

  // ─────────────────────────────────────────────
  // AVAILABILITY LOGISTICS (now tied to ScheduledSessionDto)
  // ─────────────────────────────────────────────
  openAvailability(s: ScheduledSessionDto): void {
    this.selectedAvailabilitySession = s as any;
    this.availabilityOpen = true;
    this.availabilityLoading = true;
    this.detailsOpen = false;

    setTimeout(() => {
      const el = document.getElementById('availability-details');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    const sessionId = s.id;
    if (!sessionId) return;

    this.transportApi.getAvailability(sessionId).subscribe({
      next: (data) => {
        this.availabilityData = data;
        this.availabilityForm = {
          availabilityStatus: data.availabilityStatus || 'CONFIRMED',
          childMood: data.childMood || 'CALM',
          transportNeeded: data.transportNeeded || false,
          hasTransportAlternative: data.hasTransportAlternative || false,
          comment: ''
        };
        this.availabilityLoading = false;
      },
      error: () => {
        // If 404 or backend error, default to empty form
        this.availabilityData = null;
        this.availabilityForm = {
          availabilityStatus: 'CONFIRMED',
          childMood: 'CALM',
          transportNeeded: false,
          hasTransportAlternative: false,
          comment: ''
        };
        this.availabilityLoading = false;
      }
    });
  }

  closeAvailability(): void {
    this.availabilityOpen = false;
    this.selectedAvailabilitySession = null;
  }

  submitAvailability(): void {
    if (!this.selectedAvailabilitySession?.id) return;
    
    this.availabilitySaving = true;
    this.transportApi.respondToAvailability(this.selectedAvailabilitySession.id, this.availabilityForm).subscribe({
      next: (data) => {
        this.availabilityData = data;
        this.availabilitySaving = false;
        alert('Availability response saved successfully.');
        this.closeAvailability();
        
        // Refresh readiness internally if the session details drawer is open
        if (this.selectedAvailabilitySession?.id) {
           this.transportApi.getReadiness(this.selectedAvailabilitySession.id).subscribe({
             next: (readyData) => {
                if (this.selectedSession?.id === this.selectedAvailabilitySession?.id) {
                    this.selectedSessionReadiness = readyData;
                }
             }
           });
        }
      },
      error: () => {
        this.availabilitySaving = false;
        alert('Failed to save availability response.');
      }
    });
  }

  downloadReport(sessionId: string): void {
    this.api.getMySessionReportPdf(sessionId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dialysis-report-${sessionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to download PDF report.'),
    });
  }

  // ─────────────────────────────────────────────
  // utils
  // ─────────────────────────────────────────────
  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private safeDate(iso: string | null | undefined): number {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private getWeekBounds(today: Date): { start: Date; end: Date } {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);

    const day = d.getDay(); // 0 Sun
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(d);
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }
}
