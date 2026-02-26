import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { HospitalizationService } from './hospitalization.service';

export interface CriticalNotification {
  id: string;
  hospitalizationId: number;
  patientId: number;
  roomNumber: string;
  type: 'temperature' | 'heartRate' | 'oxygenSaturation' | 'respiratoryRate' | 'multiple';
  message: string;
  details: string[];
  severity: 'critical' | 'warning';
  timestamp: Date;
  read: boolean;
  acknowledged: boolean;
}

export interface ToastAlert {
  id: string;
  message: string;
  details: string[];
  severity: 'critical' | 'warning';
  roomNumber: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private readonly POLL_INTERVAL_MS = 30_000;

  private notifications$ = new BehaviorSubject<CriticalNotification[]>([]);
  private toasts$        = new BehaviorSubject<ToastAlert[]>([]);
  private pollSub?: Subscription;

  // Audio instance — loaded once, reused
  private alertAudio = new Audio('assets/template/sounds/alert.mp3');

  /** Observable that components subscribe to */
  notifications = this.notifications$.asObservable();

  /** Observable for toast popups */
  toasts = this.toasts$.asObservable();

  get unreadCount(): number {
    return this.notifications$.value.filter(n => !n.read).length;
  }

  get allNotifications(): CriticalNotification[] {
    return this.notifications$.value;
  }

  constructor(
    private hospService: HospitalizationService,
    private keycloakService: KeycloakService
  ) {
    if (this.keycloakService.isUserInRole('doctor')) {
      this.startPolling();
    }
  }

  // ── Polling ───────────────────────────────────────────────────────────────

  startPolling(): void {
    this.checkForCriticals();
    this.pollSub = interval(this.POLL_INTERVAL_MS)
      .subscribe(() => this.checkForCriticals());
  }

  private checkForCriticals(): void {
    this.hospService.getAll().subscribe({
      next: (data: any[]) => {
        const currentNotifs = this.notifications$.value;
        const newNotifs: CriticalNotification[] = [];

        data.forEach(h => {
          if (!h.vitalSignsRecords?.length) return;

          h.vitalSignsRecords.forEach((vs: any) => {
            const alerts = this.evaluateVitals(vs);
            if (!alerts.length) return;

            const notifId = `${h.id}-${vs.recordDate}`;
            if (currentNotifs.some(n => n.id === notifId)) return;

            const severity: CriticalNotification['severity'] =
              alerts.some(a => a.critical) ? 'critical' : 'warning';

            const type: CriticalNotification['type'] =
              alerts.length > 1 ? 'multiple' : alerts[0].type;

            newNotifs.push({
              id: notifId,
              hospitalizationId: h.id,
              patientId: h.userId,
              roomNumber: h.roomNumber || '—',
              type,
              message: severity === 'critical'
                ? `Critical vitals — Room ${h.roomNumber || '—'} · Patient #${h.userId}`
                : `Abnormal vitals — Room ${h.roomNumber || '—'} · Patient #${h.userId}`,
              details: alerts.map(a => a.message),
              severity,
              timestamp: new Date(vs.recordDate),
              read: false,
              acknowledged: false
            });
          });
        });

        if (newNotifs.length) {
          const merged = [...newNotifs, ...currentNotifs];
          merged.sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          this.notifications$.next(merged);

          // ── Fire sound + toasts for each new alert ────────────────────
          this.playAlertSound(newNotifs.some(n => n.severity === 'critical'));
          newNotifs.forEach(n => this.showToast(n));
        }
      },
      error: err => console.error('Notification poll error', err)
    });
  }

  // ── Sound ─────────────────────────────────────────────────────────────────

  private playAlertSound(isCritical: boolean): void {
    try {
      this.alertAudio.volume = isCritical ? 1.0 : 0.5; // louder for critical
      this.alertAudio.currentTime = 0;                  // rewind to start
      this.alertAudio.play().catch(() => {
        // Browser blocks autoplay until user has interacted with the page — safe to ignore
      });
    } catch (e) {
      console.warn('Could not play alert sound', e);
    }
  }

  // ── Toast popups ──────────────────────────────────────────────────────────

  private showToast(notif: CriticalNotification): void {
    const toast: ToastAlert = {
      id:         notif.id,
      message:    notif.message,
      details:    notif.details.slice(0, 2), // show max 2 detail lines in popup
      severity:   notif.severity,
      roomNumber: notif.roomNumber,
      timestamp:  notif.timestamp
    };

    const current = this.toasts$.value;
    this.toasts$.next([toast, ...current]);

    // Auto-dismiss after 6 seconds (critical) or 4 seconds (warning)
    const ttl = notif.severity === 'critical' ? 6000 : 4000;
    setTimeout(() => this.dismissToast(toast.id), ttl);
  }

  dismissToast(id: string): void {
    const updated = this.toasts$.value.filter(t => t.id !== id);
    this.toasts$.next(updated);
  }

  // ── Clinical thresholds ───────────────────────────────────────────────────

  private evaluateVitals(
    vs: any
  ): { type: CriticalNotification['type']; message: string; critical: boolean }[] {

    const alerts: { type: CriticalNotification['type']; message: string; critical: boolean }[] = [];

    if (vs.temperature != null) {
      if (vs.temperature > 39.5)
        alerts.push({ type: 'temperature', message: `High fever: ${vs.temperature}°C (>39.5°C)`, critical: true });
      else if (vs.temperature > 38)
        alerts.push({ type: 'temperature', message: `Fever: ${vs.temperature}°C (>38°C)`, critical: false });
      else if (vs.temperature < 35)
        alerts.push({ type: 'temperature', message: `Hypothermia: ${vs.temperature}°C (<35°C)`, critical: true });
      else if (vs.temperature < 36)
        alerts.push({ type: 'temperature', message: `Low temperature: ${vs.temperature}°C (<36°C)`, critical: false });
    }

    if (vs.heartRate != null) {
      if (vs.heartRate > 150)
        alerts.push({ type: 'heartRate', message: `Severe tachycardia: ${vs.heartRate} bpm (>150)`, critical: true });
      else if (vs.heartRate > 100)
        alerts.push({ type: 'heartRate', message: `Tachycardia: ${vs.heartRate} bpm (>100)`, critical: false });
      else if (vs.heartRate < 40)
        alerts.push({ type: 'heartRate', message: `Severe bradycardia: ${vs.heartRate} bpm (<40)`, critical: true });
      else if (vs.heartRate < 60)
        alerts.push({ type: 'heartRate', message: `Bradycardia: ${vs.heartRate} bpm (<60)`, critical: false });
    }

    if (vs.oxygenSaturation != null) {
      if (vs.oxygenSaturation < 90)
        alerts.push({ type: 'oxygenSaturation', message: `Critical SpO₂: ${vs.oxygenSaturation}% (<90%)`, critical: true });
      else if (vs.oxygenSaturation < 95)
        alerts.push({ type: 'oxygenSaturation', message: `Low SpO₂: ${vs.oxygenSaturation}% (<95%)`, critical: false });
    }

    if (vs.respiratoryRate != null) {
      if (vs.respiratoryRate > 30 || vs.respiratoryRate < 8)
        alerts.push({ type: 'respiratoryRate', message: `Critical resp. rate: ${vs.respiratoryRate}/min`, critical: true });
      else if (vs.respiratoryRate > 20 || vs.respiratoryRate < 12)
        alerts.push({ type: 'respiratoryRate', message: `Abnormal resp. rate: ${vs.respiratoryRate}/min`, critical: false });
    }

    return alerts;
  }

  // ── Public actions ────────────────────────────────────────────────────────

  markAllRead(): void {
    const updated = this.notifications$.value.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
  }

  markRead(id: string): void {
    const updated = this.notifications$.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);
  }

  acknowledge(id: string): void {
    const updated = this.notifications$.value.map(n =>
      n.id === id ? { ...n, acknowledged: true, read: true } : n
    );
    this.notifications$.next(updated);
  }

  clearAll(): void {
    this.notifications$.next([]);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}