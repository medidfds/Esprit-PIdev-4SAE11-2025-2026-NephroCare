import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription, interval, startWith, switchMap, forkJoin, of, finalize } from 'rxjs';

import { DropdownComponent} from "../../../../shared/components/ui/dropdown/dropdown.component";
import { DropdownItemComponent} from "../../../../shared/components/ui/dropdown/dropdown-item/dropdown-item.component";

import { NotificationApiService, NotificationDto} from "../../../../shared/services/notification-api.service";
import { DialysisService} from "../../../../shared/services/dialysis.service";

@Component({
  selector: 'app-dialysis-notification',
  templateUrl: './dialysis-notification.component.html',
  styleUrls: ['./dialysis-notification.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent],
})
export class DialysisNotificationComponent implements OnInit, OnDestroy {
  isOpen = false;

  notifying = false;      // ping dot
  unread = 0;             // unread count
  notifications: NotificationDto[] = [];

  // prevents double-click spam
  busyIds = new Set<string>();

  private pollSub?: Subscription;

  constructor(
      private notifApi: NotificationApiService,
      private dialysisApi: DialysisService
  ) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private startPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(3000).pipe(
        startWith(0),
        switchMap(() => forkJoin({
          list: this.notifApi.my(),
          unread: this.notifApi.unreadCount(),
        }))
    ).subscribe({
      next: (res) => {
        const prevUnread = this.unread;

        this.notifications = res.list ?? [];
        this.unread = res.unread ?? 0;

        // ping when new unread arrives
        this.notifying = this.unread > 0 && this.unread !== prevUnread;
      },
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notifying = false;
      this.refreshOnce();
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  refreshOnce() {
    forkJoin({
      list: this.notifApi.my(),
      unread: this.notifApi.unreadCount(),
    }).subscribe((res) => {
      this.notifications = res.list ?? [];
      this.unread = res.unread ?? 0;
    });
  }

  // ====== parsing helpers
  private payload(n: NotificationDto): any {
    try { return n.payloadJson ? JSON.parse(n.payloadJson) : null; }
    catch { return null; }
  }

  private scheduledSessionId(n: NotificationDto): string | null {
    // prefer entityId (you set it to ScheduledSession.id)
    if (n.entityId) return n.entityId;

    // fallback to payloadJson.scheduledSessionId
    const p = this.payload(n);
    return p?.scheduledSessionId ?? null;
  }

  // ====== display filters
  // If you want nurse dropdown to show ONLY pending assignment requests:
  visibleNotifications(): NotificationDto[] {
    // only show unread schedule requests that are actionable
    return (this.notifications ?? []).filter(n =>
        n.type === 'SCHEDULE_REQUEST' &&
        !n.readAt &&
        !!this.scheduledSessionId(n)
    );
  }

  // If instead you want to show everything: use notifications directly in HTML.
  // visibleNotifications(): NotificationDto[] { return this.notifications ?? []; }

  isScheduleRequest(n: NotificationDto): boolean {
    return n.type === 'SCHEDULE_REQUEST' && !!this.scheduledSessionId(n);
  }

  // ====== mark read (and remove from UI)
  markReadAndRemove(n: NotificationDto) {
    if (!n || n.readAt) {
      // already read => just remove if you want
      this.notifications = this.notifications.filter(x => x.id !== n.id);
      return;
    }

    // optimistic UI: remove immediately
    this.notifications = this.notifications.filter(x => x.id !== n.id);
    if (this.unread > 0) this.unread--;

    this.notifApi.markRead(n.id).subscribe({
      next: () => {},
      error: () => {
        // revert if needed (optional)
        this.refreshOnce();
      }
    });
  }

  // ===== Nurse actions
  accept(n: NotificationDto) {
    const scheduledId = this.scheduledSessionId(n);
    if (!scheduledId) return;

    if (this.busyIds.has(n.id)) return;
    this.busyIds.add(n.id);

    this.dialysisApi.acceptAssignment(scheduledId).pipe(
        switchMap(() => this.notifApi.markRead(n.id)),
        finalize(() => this.busyIds.delete(n.id))
    ).subscribe({
      next: () => {
        // remove from UI immediately
        this.notifications = this.notifications.filter(x => x.id !== n.id);
        if (this.unread > 0) this.unread--;
      },
      error: () => {
        // if accept fails, do not lose notif
        this.refreshOnce();
      }
    });
  }

  reject(n: NotificationDto) {
    const scheduledId = this.scheduledSessionId(n);
    if (!scheduledId) return;

    if (this.busyIds.has(n.id)) return;
    this.busyIds.add(n.id);

    this.dialysisApi.rejectAssignment(scheduledId, 'Not available').pipe(
        switchMap(() => this.notifApi.markRead(n.id)),
        finalize(() => this.busyIds.delete(n.id))
    ).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(x => x.id !== n.id);
        if (this.unread > 0) this.unread--;
      },
      error: () => {
        this.refreshOnce();
      }
    });
  }
}