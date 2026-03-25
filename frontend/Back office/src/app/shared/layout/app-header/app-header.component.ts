import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
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
    DialysisNotificationComponent,
    UserDropdownComponent,

  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  readonly isMobileOpen$;

  constructor(public sidebarService: SidebarService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }
}
