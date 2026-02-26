import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    const isLoggedIn = await this.keycloakService.isLoggedIn();

    // 🔐 If not logged in → redirect to Keycloak login
    if (!isLoggedIn) {
      await this.keycloakService.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    // 🎯 Allow ONLY labTech and patient
    const allowedRoles = ['labTech', 'patient'];

    const hasAccess = allowedRoles.some(role =>
      this.keycloakService.isUserInRole(role)
    );

    if (!hasAccess) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}