import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { ClinicalComponent } from './pages/clinical/clinical.component';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Dashboard | Sbitar - Healthcare Management System',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Calendar | Sbitar - Healthcare Management System'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Profile | Sbitar - Healthcare Management System'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Form Elements | Sbitar - Healthcare Management System'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Tables | Sbitar - Healthcare Management System'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Blank Page | Sbitar - Healthcare Management System'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Invoices | Sbitar - Healthcare Management System'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Line Chart | Sbitar - Healthcare Management System'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Bar Chart | Sbitar - Healthcare Management System'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Alerts | Sbitar - Healthcare Management System'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Avatars | Sbitar - Healthcare Management System'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Badges | Sbitar - Healthcare Management System'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Buttons | Sbitar - Healthcare Management System'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Images | Sbitar - Healthcare Management System'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Videos | Sbitar - Healthcare Management System'
      },
      {
        path:'clinical',
        component:ClinicalComponent,
        title:'Medical History | Sbitar - Healthcare Management System'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Sign In | Sbitar - Healthcare Management System'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Sign Up | Sbitar - Healthcare Management System'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Not Found | Sbitar - Healthcare Management System'
  },
];
