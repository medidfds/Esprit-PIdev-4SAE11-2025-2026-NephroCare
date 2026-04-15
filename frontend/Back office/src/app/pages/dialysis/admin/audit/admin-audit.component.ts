import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialysisService } from '../../../../shared/services/dialysis.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';

type DateFilter = 'ALL' | 'TODAY' | '7D' | '30D';

export interface SuspendedTreatmentAuditRow {
    treatmentId: string;
    patientName?: string | null;
    dialysisType?: string | null;
    vascularAccessType?: string | null;
    suspensionReason?: string | null;
    suspendedAt?: string | null;
}

@Component({
    selector: 'app-admin-audit',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, BadgeComponent],
    templateUrl: './admin-audit.component.html',
    styleUrls: ['./admin-audit.component.css'],
})
export class AdminAuditComponent implements OnInit {
    loading = true;
    errorMessage: string | null = null;

    logs: any[] = [];

    // filters
    searchText = '';
    dateFilter: DateFilter = '30D';

    // sorting
    sortBy: 'suspendedAt' | 'patientName' | 'dialysisType' | 'vascularAccessType' = 'suspendedAt';
    sortDir: 'asc' | 'desc' = 'desc';

    constructor(private service: DialysisService) {}

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(): void {
        this.loading = true;
        this.errorMessage = null;

        this.service.getSuspendedTreatmentsAudit().subscribe({
            next: (data: any[]) => {
                this.logs = (data ?? []).map((x) => ({
                    id: x.id || x.treatmentId,
                    performedAt: x.suspendedAt || new Date().toISOString(),
                    username: 'System', 
                    action: 'SUSPEND',
                    entityType: 'TREATMENT',
                    entityId: x.treatmentId || x.id,
                    details: x.suspensionReason || x.suspendedReason || 'Clinical suspension',
                }));
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = err?.error?.messages?.join(', ') || err?.error?.message || 'Failed to load audit logs.';
                this.loading = false;
            },
        });
    }

    onFilter(): void {
        // client-side filter stub for now if needed, but the template calls it
        this.loadLogs();
    }

    clearFilters(): void {
        this.searchText = '';
        this.loadLogs();
    }
}
