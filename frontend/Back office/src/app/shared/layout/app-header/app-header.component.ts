import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import {
  DialysisNotificationComponent
} from "../../../pages/dialysis/dialysis-notification/dialysis-notification-dropdown/dialysis-notification.component";

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent,
    DialysisNotificationComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  readonly isMobileOpen$;
  isAdmin = false;
  isNurseOrDoctor = false;

  constructor(
    public sidebarService: SidebarService,
    private keycloak: KeycloakService
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isAdmin = this.keycloak.isUserInRole('admin');
    this.isNurseOrDoctor = this.keycloak.isUserInRole('nurse') || this.keycloak.isUserInRole('doctor');
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }
}
