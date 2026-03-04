import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClinicalService, DoctorEfficiencyMetric } from '../../../services/clinical.service';

type DashboardModule = {
  name: string;
  description: string;
  route: string;
  status: 'active' | 'monitoring';
};

type RoleArea = {
  role: string;
  responsibilities: string;
};

@Component({
  selector: 'app-ecommerce',
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {
  readonly today = new Date();
  doctorEfficiency: DoctorEfficiencyMetric[] = [];
  loadingDoctorEfficiency = true;
  doctorEfficiencyError: string | null = null;

  readonly projectModules: DashboardModule[] = [
    {
      name: 'Clinical Service',
      description: 'Consultations, medical histories, triage queue and doctor assignment flows.',
      route: '/clinical',
      status: 'active'
    },
    {
      name: 'Hospitalization Service',
      description: 'In-patient records, room follow-up, vitals and doctor workload statistics.',
      route: '/hospitalization',
      status: 'active'
    },
    {
      name: 'Consultations Calendar',
      description: 'Operational schedule view for patient and doctor consultation planning.',
      route: '/consultations-calendar',
      status: 'active'
    },
    {
      name: 'Hospitalization Analytics',
      description: 'Occupancy, trends and service-level indicators for inpatient monitoring.',
      route: '/statistique-hospitalization',
      status: 'monitoring'
    },
    {
      name: 'Dialysis Module',
      description: 'Treatment plan/session execution and patient dialysis lifecycle follow-up.',
      route: '/calendar',
      status: 'monitoring'
    },
    {
      name: 'User & Access',
      description: 'Role-based access via Keycloak, profile controls and operational security.',
      route: '/profile',
      status: 'active'
    }
  ];

  readonly roleAreas: RoleArea[] = [
    { role: 'Doctor', responsibilities: 'Diagnosis, triage care start, and consultation decisions.' },
    { role: 'Nurse', responsibilities: 'Vital signs tracking and inpatient follow-up operations.' },
    { role: 'Pharmacist', responsibilities: 'Prescription flow and medication validation pipeline.' },
    { role: 'Lab / Radiology', responsibilities: 'Diagnostic result entry and imaging/lab workflows.' },
    { role: 'Admin', responsibilities: 'System governance, account lifecycle, and module supervision.' }
  ];

  constructor(private clinicalService: ClinicalService) {}

  ngOnInit(): void {
    this.loadDoctorEfficiency();
  }

  get topDoctorEfficiency(): DoctorEfficiencyMetric[] {
    return this.doctorEfficiency.slice(0, 5);
  }

  get bestEfficiencyScore(): number {
    return this.topDoctorEfficiency.length > 0 ? this.topDoctorEfficiency[0].efficiencyScore : 0;
  }

  get averageSlaRespectRate(): number {
    if (this.topDoctorEfficiency.length === 0) {
      return 0;
    }
    const total = this.topDoctorEfficiency.reduce((sum, item) => sum + item.slaRespectRate, 0);
    return total / this.topDoctorEfficiency.length;
  }

  get totalTrackedCases(): number {
    return this.topDoctorEfficiency.reduce((sum, item) => sum + item.assignedCases, 0);
  }

  getEfficiencyTone(score: number): string {
    if (score >= 80) {
      return 'Excellent';
    }
    if (score >= 60) {
      return 'Good';
    }
    if (score >= 40) {
      return 'Average';
    }
    return 'Low';
  }

  getEfficiencyToneClass(score: number): string {
    if (score >= 80) {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    }
    if (score >= 60) {
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
    }
    if (score >= 40) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    }
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
  }

  private loadDoctorEfficiency(): void {
    this.loadingDoctorEfficiency = true;
    this.doctorEfficiencyError = null;
    this.clinicalService.getDoctorEfficiency().subscribe({
      next: (metrics) => {
        this.doctorEfficiency = metrics ?? [];
        this.loadingDoctorEfficiency = false;
      },
      error: (err) => {
        this.loadingDoctorEfficiency = false;
        this.doctorEfficiencyError = err.message || 'Failed to load doctor efficiency metrics';
      }
    });
  }
}
