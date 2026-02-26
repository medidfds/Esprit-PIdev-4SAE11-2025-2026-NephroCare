import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
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

  private baseUrl = 'http://localhost:8070/diagnostic/notifications';

  // ⚠️ Remplacez par votre AuthService si vous en avez un
  currentUserId = 'lab_user';

  isOpen    = false;
  notifying = false;   // contrôle le point orange sur la cloche

  notifications: DiagnosticNotification[] = [];
  private pollSub!: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Polling toutes les 30 secondes
    this.pollSub = interval(30_000).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<DiagnosticNotification[]>(
          `${this.baseUrl}/user/${this.currentUserId}`
        )
      )
    ).subscribe({
      next: data => {
        this.notifications = data;
        // Allumer le point orange s'il y a des non lues
        this.notifying = data.some(n => !n.isRead);
      },
      error: err => console.error('Notification error', err)
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

  // ── Marquer toutes lues ──────────────────────────────────
  markAllRead(): void {
    this.http.put<void>(`${this.baseUrl}/user/${this.currentUserId}/read-all`, null)
      .subscribe(() => {
        this.notifications.forEach(n => n.isRead = true);
        this.notifying = false;
      });
  }

  // ── Acquitter une notif critique ─────────────────────────
  acknowledge(notif: DiagnosticNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.http.put<DiagnosticNotification>(
      `${this.baseUrl}/${notif.id}/acknowledge`,
      null,
      { params: { by: this.currentUserId } }
    ).subscribe(() => {
      notif.isAcknowledged = true;
      notif.isRead = true;
    });
  }

  // ── Getters utiles pour le template ─────────────────────
  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  get hasCritical(): boolean {
    return this.notifications.some(
      n => n.severity === 'CRITICAL' && !n.isAcknowledged
    );
  }

  // ── Helpers affichage ────────────────────────────────────
  severityIcon(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH':     return '⚡';
      case 'MEDIUM':   return '⚠️';
      default:         return '📋';
    }
  }

  severityDotClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH':     return 'bg-orange-500';
      case 'MEDIUM':   return 'bg-yellow-400';
      default:         return 'bg-gray-400';
    }
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return 'À l\'instant';
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return `${Math.floor(diff / 86400)} j ago`;
  }
}