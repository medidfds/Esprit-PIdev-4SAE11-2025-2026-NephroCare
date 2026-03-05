import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth-guard';
import {DiagnosticComponent} from './diagnostic/diagnostic.component';
import {HospitalizationComponent} from './hospitalization/hospitalization.component';
import { NotificationsComponent } from './Notifications/Notifications.component';
import { ProfileComponent } from './Profile/Profile.component';
import { ClinicalComponent } from './clinical/clinical.component';
import { PharmacyComponent } from './pharmacy/pharmacy.component';
import {DialysisPortalComponent} from './dialysis/pages/dialysis-portal/dialysis-portal.component';


const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },

  { path: 'diagnostic', component: DiagnosticComponent, canActivate: [AuthGuard] },
  { path: 'clinical', component: ClinicalComponent, canActivate: [AuthGuard] },
  { path: 'hospitalization', component: HospitalizationComponent, canActivate: [AuthGuard] },
  { path: 'dialysis', component: DialysisPortalComponent, canActivate: [AuthGuard] },
  { path: 'pharmacy', component: PharmacyComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
