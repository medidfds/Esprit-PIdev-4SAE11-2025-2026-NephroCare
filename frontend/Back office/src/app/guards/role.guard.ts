import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    constructor(private keycloak: KeycloakService, private router: Router) {}

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
        const userRoles = await this.keycloak.getUserRoles();
        const requiredRoles = route.data['roles'] as string[];

        // If no specific roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Check if user has any of the required roles
        const hasRole = requiredRoles.some(role => userRoles.includes(role));

        if (hasRole) {
            return true;
        }

        // Deny access and navigate to home
        this.router.navigate(['/']);
        return false;
    }
}
