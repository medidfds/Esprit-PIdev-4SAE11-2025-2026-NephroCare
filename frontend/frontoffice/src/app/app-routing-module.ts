import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth-guard';
import { DiagnosticComponent } from './diagnostic/diagnostic.component';
import { HospitalizationComponent } from './hospitalization/hospitalization.component';
import { DiagnosticCalendarComponent } from './diagnostic-calendar/diagnostic-calendar.component'; // ← AJOUTÉ


const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'diagnostic',
    component: DiagnosticComponent,
    canActivate: [AuthGuard],
    data: { roles: ['labTech'] }
  },
  {
    path: 'diagnostic-calendar',          // ← AJOUTÉ
    component: DiagnosticCalendarComponent,
    canActivate: [AuthGuard],
    data: { roles: ['labTech'] }
  },
  {
    path: 'hospitalization',
    component: HospitalizationComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }