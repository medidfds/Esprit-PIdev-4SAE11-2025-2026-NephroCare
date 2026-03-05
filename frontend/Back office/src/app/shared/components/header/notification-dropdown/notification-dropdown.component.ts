import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, of, Subscription } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';

export interface DiagnosticNotification {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  targetUserId: string;
  relatedOrderId?: string;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private readonly baseUrl = 'http://localhost:8070/diagnostic/notifications';
  // No notifications endpoint exists yet in diagnostic-service.
  // Keep false to avoid repeated 404 requests from the browser.
  private readonly notificationsEnabled = false;

  currentUserId = '';
  isOpen = false;
  notifying = false;
  notifications: DiagnosticNotification[] = [];
  private notificationsEndpointDisabled = false;

  private pollSub!: Subscription;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    if (!this.notificationsEnabled) {
      return;
    }

    this.currentUserId = this.resolveCurrentUserId();
    if (!this.currentUserId) {
      return;
    }

    this.pollSub = interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.notificationsEndpointDisabled) {
            return of([] as DiagnosticNotification[]);
          }
          return this.http
            .get<DiagnosticNotification[]>(`${this.baseUrl}/user/${this.currentUserId}`)
            .pipe(
              catchError((err) => {
                if (err?.status === 404) {
                  this.notificationsEndpointDisabled = true;
                } else {
                  console.error('Notification error', err);
                }
                return of([] as DiagnosticNotification[]);
              })
            );
        })
      )
      .subscribe((data) => {
        this.notifications = data;
        this.notifying = data.some((n) => !n.isRead);
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.unreadCount > 0) {
      this.markAllRead();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  markAllRead(): void {
    if (!this.currentUserId) {
      return;
    }

    this.http
      .put<void>(`${this.baseUrl}/user/${this.currentUserId}/read-all`, null)
      .pipe(catchError(() => of(void 0)))
      .subscribe(() => {
        this.notifications.forEach((n) => (n.isRead = true));
        this.notifying = false;
      });
  }

  acknowledge(notif: DiagnosticNotification, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.currentUserId) {
      return;
    }

    this.http
      .put<DiagnosticNotification>(`${this.baseUrl}/${notif.id}/acknowledge`, null, {
        params: { by: this.currentUserId }
      })
      .pipe(catchError(() => of(notif)))
      .subscribe(() => {
        notif.isAcknowledged = true;
        notif.isRead = true;
      });
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  get hasCritical(): boolean {
    return this.notifications.some((n) => n.severity === 'CRITICAL' && !n.isAcknowledged);
  }

  severityIcon(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'Critical';
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      default:
        return 'Info';
    }
  }

  severityDotClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-400';
      default:
        return 'bg-gray-400';
    }
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return `${Math.floor(diff / 86400)} j ago`;
  }

  private resolveCurrentUserId(): string {
    const token: any = this.keycloakService.getKeycloakInstance()?.tokenParsed;
    const candidate = token?.preferred_username || token?.sub || '';
    return String(candidate || '').trim();
  }
}

