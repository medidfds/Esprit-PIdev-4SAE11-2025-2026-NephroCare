import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    constructor(private keycloak: KeycloakService, private router: Router) {}

    async canActivate(): Promise<boolean> {
        const userRoles = await this.keycloak.getUserRoles();

        // Allow only doctor, admin, nurse or labTech
        if (userRoles.includes('doctor') || userRoles.includes('admin') || userRoles.includes('nurse') || userRoles.includes('labTech')) {
            return true;
        }

        // Otherwise, logout and go back to Keycloak login page
        await this.keycloak.logout();
        return false;
    }
}