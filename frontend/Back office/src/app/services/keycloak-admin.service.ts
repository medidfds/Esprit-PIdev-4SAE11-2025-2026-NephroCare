import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, catchError, of, forkJoin } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import keycloakConfig from '../keycloak.config';

export interface KeycloakUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled: boolean;
  attributes?: Record<string, string[]>; // from File 1
}

@Injectable({ providedIn: 'root' })
export class KeycloakAdminService {

  private readonly adminBaseUrl = `${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}`;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) {}

  getUsersByRole(roleName: string): Observable<KeycloakUser[]> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<KeycloakUser[]>(
          `${this.adminBaseUrl}/roles/${roleName}/users?max=200`,
          { headers }
        ).pipe(
          switchMap(users => this.hydrateUsers(users, headers)) // from File 1
        );
      }),
      catchError(err => {
        console.error(`Keycloak error status: ${err.status}`, err.error);
        return this.getAllUsersWithRole(roleName); // from File 1
      })
    );
  }

  // from File 2
  getUserById(userId: string): Observable<KeycloakUser> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.get<KeycloakUser>(
          `${this.adminBaseUrl}/users/${userId}`,
          { headers }
        );
      }),
      catchError(() => of({ id: userId, username: userId, enabled: true }))
    );
  }

  // from File 1
  private getAllUsersWithRole(roleName: string): Observable<KeycloakUser[]> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

        return this.http.get<KeycloakUser[]>(
          `${this.adminBaseUrl}/users?max=200`,
          { headers }
        ).pipe(
          switchMap((users: KeycloakUser[]) => {
            if (!users.length) return of([]);

            const checks$ = users.map((user: KeycloakUser) =>
              this.http.get<{ name: string }[]>(
                `${this.adminBaseUrl}/users/${user.id}/role-mappings/realm`,
                { headers }
              ).pipe(
                switchMap(roles =>
                  roles.some(r => r.name === roleName) ? of(user) : of(null)
                ),
                catchError(() => of(null))
              )
            );

            return forkJoin(checks$).pipe(
              switchMap(results =>
                this.hydrateUsers(
                  results.filter((u): u is KeycloakUser => u !== null),
                  headers
                )
              )
            );
          })
        );
      }),
      catchError(() => of([]))
    );
  }

  // from File 1
  private hydrateUsers(users: KeycloakUser[], headers: HttpHeaders): Observable<KeycloakUser[]> {
    if (!users.length) return of([]);

    const detailedUsers$ = users.map(user =>
      this.http.get<KeycloakUser>(
        `${this.adminBaseUrl}/users/${user.id}`,
        { headers }
      ).pipe(
        catchError(() => of(user))
      )
    );

    return forkJoin(detailedUsers$);
  }

  static displayName(user: KeycloakUser): string {
    const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return full || user.username;
  }
}