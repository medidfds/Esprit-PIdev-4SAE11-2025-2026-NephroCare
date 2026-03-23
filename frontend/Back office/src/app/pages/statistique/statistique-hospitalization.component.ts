import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { HospitalizationService } from '../../services/hospitalization.service';
import { RoomService, Room } from '../../services/Room.service';

// ── Interfaces ─────────────────────────────────────────────────────────────

interface VitalAxis {
  label:  string;
  score:  number;
  status: 'normal' | 'warning' | 'critical' | 'missing';
  value:  string;
}

interface PatientCard {
  hospitalizationId: number;
  userId:            string;
  status:            string;
  riskScore:         number;
  riskLevel:         'low' | 'moderate' | 'high' | 'critical';
  axes:              VitalAxis[];
  radarPath:         string;
  bgPath:            string;
  lastRecorded:      string;
  trend:             'improving' | 'worsening' | 'stable' | 'unknown';
  prevScore:         number | null;
  vitalsCount:       number;
}

interface RoomCard {
  room:       Room;
  patients:   PatientCard[];
  activeCount:   number;
  pendingCount:  number;
  dischargedCount: number;
  avgRisk:    number;
  worstLevel: 'low' | 'moderate' | 'high' | 'critical';
}

@Component({
  selector: 'app-statistique-hospitalization',
  templateUrl: './statistique-hospitalization.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class StatistiqueHospitalizationComponent implements OnInit {

  loading = true;
  roomCards: RoomCard[] = [];

  // ── Donut helpers (kept for potential reuse) ──────────────
  private scoreVital(
    value: number | null,
    label: string, unit: string,
    normalMin: number, normalMax: number,
    warnMin: number,   warnMax: number
  ): VitalAxis {
    if (value == null) return { label, score: 0, status: 'missing', value: '—' };
    const formatted = `${value} ${unit}`;
    if (value < warnMin   || value > warnMax  ) return { label, score: 25, status: 'critical', value: formatted };
    if (value < normalMin || value > normalMax) return { label, score: 12, status: 'warning',  value: formatted };
    return                                             { label, score: 0,  status: 'normal',   value: formatted };
  }

  constructor(
    private hospService: HospitalizationService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    forkJoin({
      hospitalizations: this.hospService.getAll(),
      rooms:            this.roomService.getAll()
    }).subscribe({
      next: ({ hospitalizations, rooms }) => {
        this.compute(hospitalizations as any[], rooms);
        this.loading = false;
      },
      error: err => { console.error(err); this.loading = false; }
    });
  }

  // ── Main computation ──────────────────────────────────────
  private compute(data: any[], rooms: Room[]): void {
    const roomMap = new Map<number, Room>(rooms.map(r => [r.id, r]));

    // Group hospitalizations by roomId
    const byRoom = new Map<number, any[]>();
    data.forEach(h => {
      const rid = h.roomId ?? h.room?.id;
      if (rid == null) return;
      if (!byRoom.has(rid)) byRoom.set(rid, []);
      byRoom.get(rid)!.push(h);
    });

    this.roomCards = [];

    byRoom.forEach((hosps, roomId) => {
      const room = roomMap.get(roomId);
      if (!room) return;

      const patients: PatientCard[] = hosps.map(h => this.buildPatientCard(h));

      const active     = hosps.filter(h => h.status === 'active').length;
      const pending    = hosps.filter(h => h.status === 'pending').length;
      const discharged = hosps.filter(h => h.status === 'discharged').length;

      const activePending = patients.filter(p => p.status === 'active' || p.status === 'pending');
      const avgRisk = activePending.length
        ? Math.round(activePending.reduce((s, p) => s + p.riskScore, 0) / activePending.length)
        : 0;

      const levelOrder = { low: 0, moderate: 1, high: 2, critical: 3 };
      const worstLevel = activePending.reduce(
        (worst, p) => levelOrder[p.riskLevel] > levelOrder[worst] ? p.riskLevel : worst,
        'low' as PatientCard['riskLevel']
      );

      this.roomCards.push({ room, patients, activeCount: active, pendingCount: pending, dischargedCount: discharged, avgRisk, worstLevel });
    });

    // Sort: highest avg risk first
    this.roomCards.sort((a, b) => b.avgRisk - a.avgRisk);
  }

  // ── Patient card builder ──────────────────────────────────
  private buildPatientCard(h: any): PatientCard {
    const records: any[] = (h.vitalSignsRecords || [])
      .filter((r: any) => r.recordDate)
      .sort((a: any, b: any) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

    const latest = records[0] ?? null;
    const prev   = records[1] ?? null;

    const axes: VitalAxis[] = [
      this.scoreVital(latest?.temperature,      'Temp',  '°C',   36, 38,  35, 39.5),
      this.scoreVital(latest?.heartRate,        'HR',    'bpm',  60, 100, 45, 120 ),
      this.scoreVital(latest?.oxygenSaturation, 'SpO₂', '%',    95, 100, 90, 100 ),
      this.scoreVital(latest?.respiratoryRate,  'RR',   '/min', 12, 20,   8, 25  ),
    ];

    const abnormalCount = axes.filter(a => a.status === 'warning' || a.status === 'critical').length;
    const compound = abnormalCount > 1 ? 1 + (abnormalCount - 1) * 0.10 : 1;
    const riskScore = Math.min(100, Math.round(axes.reduce((s, a) => s + a.score, 0) * compound));

    const riskLevel: PatientCard['riskLevel'] =
      riskScore >= 75 ? 'critical' :
      riskScore >= 40 ? 'high'     :
      riskScore >= 15 ? 'moderate' : 'low';

    // Trend
    let trend: PatientCard['trend'] = 'unknown';
    let prevScore: number | null = null;
    if (prev) {
      const prevAxes = [
        this.scoreVital(prev.temperature,      'T', '°C',   36,38,35,39.5),
        this.scoreVital(prev.heartRate,        'H', 'bpm',  60,100,45,120),
        this.scoreVital(prev.oxygenSaturation, 'O', '%',   95,100,90,100),
        this.scoreVital(prev.respiratoryRate,  'R', '',    12,20,8,25),
      ];
      prevScore = prevAxes.reduce((s, a) => s + a.score, 0);
      const latScore = axes.reduce((s, a) => s + a.score, 0);
      trend = latScore > prevScore ? 'worsening' : latScore < prevScore ? 'improving' : 'stable';
    }

    // Radar (square 80×80, center 40,40, radius 32)
    const R = 32; const cx = 40; const cy = 40;
    const angles = [-90, 0, 90, 180].map(d => d * Math.PI / 180);
    const bgPath = angles.map(a => `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`).join(' ');
    const radarPath = axes.map((ax, i) => {
      const r = (ax.score / 25) * R;
      return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;
    }).join(' ');

    return {
      hospitalizationId: h.id,
      userId:            h.userId ?? '—',
      status:            h.status,
      riskScore, riskLevel, axes, radarPath, bgPath, prevScore,
      vitalsCount: records.length,
      lastRecorded: latest?.recordDate
        ? new Date(latest.recordDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
        : 'No data',
      trend,
    };
  }

  // ── SVG arc for score ring ────────────────────────────────
  arcPath(score: number, r: number, cx: number, cy: number): string {
    const pct   = Math.min(score / 100, 0.9999);
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    const x     = cx + r * Math.cos(angle);
    const y     = cy + r * Math.sin(angle);
    const large = pct > 0.5 ? 1 : 0;
    return `M ${cx},${cy - r} A ${r},${r} 0 ${large},1 ${x},${y}`;
  }

  // ── Style helpers ─────────────────────────────────────────
  riskColor(level: PatientCard['riskLevel']): string {
    return { low:'#10b981', moderate:'#f59e0b', high:'#ef4444', critical:'#7c3aed' }[level];
  }
  riskBg(level: PatientCard['riskLevel']): string {
    return {
      low:      'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5',
      moderate: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5',
      high:     'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5',
      critical: 'border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5',
    }[level];
  }
  riskBadge(level: PatientCard['riskLevel']): string {
    return {
      low:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      high:     'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
      critical: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    }[level];
  }
  roomHeaderBg(level: PatientCard['riskLevel']): string {
    return {
      low:      'from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent',
      moderate: 'from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent',
      high:     'from-red-50 to-white dark:from-red-500/10 dark:to-transparent',
      critical: 'from-violet-50 to-white dark:from-violet-500/10 dark:to-transparent',
    }[level];
  }
  axisColor(status: VitalAxis['status']): string {
    return { normal:'#10b981', warning:'#f59e0b', critical:'#ef4444', missing:'#94a3b8' }[status];
  }
  trendIcon(trend: PatientCard['trend']): string {
    return { improving:'↓', worsening:'↑', stable:'→', unknown:'·' }[trend];
  }
  trendLabel(trend: PatientCard['trend']): string {
    return { improving:'Improving', worsening:'Worsening', stable:'Stable', unknown:'Unknown' }[trend];
  }
  trendClass(trend: PatientCard['trend']): string {
    return {
      improving: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      worsening: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
      stable:    'text-gray-500 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-white/[0.05] dark:border-gray-700',
      unknown:   'text-gray-400 bg-gray-50 border-gray-100 dark:text-gray-500 dark:bg-white/[0.02] dark:border-gray-800',
    }[trend];
  }
  readonly roomTypeLabels: Record<string,string> = {
    standard:'Standard', intensive:'ICU', isolation:'Isolation', pediatric:'Pediatric', maternity:'Maternity',
  };
  readonly roomTypeColors: Record<string,string> = {
    standard:'bg-blue-100 text-blue-700', intensive:'bg-red-100 text-red-700',
    isolation:'bg-amber-100 text-amber-700', pediatric:'bg-pink-100 text-pink-700',
    maternity:'bg-purple-100 text-purple-700',
  };
  occupancyPercent(room: Room): number {
    return Math.round((room.currentOccupancy / room.capacity) * 100);
  }
  statusBadge(status: string): string {
    return {
      active:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      pending:    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      discharged: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400',
    }[status] ?? 'bg-gray-100 text-gray-500';
  }
}